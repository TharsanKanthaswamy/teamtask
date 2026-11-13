import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { LoginResponse } from '@teamtrack/shared';

@Injectable()
export class AuthService {
  private readonly SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async login(email: string, password: string, ipAddress?: string): Promise<LoginResponse> {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        platformAdmin: true,
        teamMembers: {
          where: { status: 'ACTIVE' },
          include: {
            team: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify user has local password set (not Google SSO only)
    if (!user.passwordHash) {
      throw new UnauthorizedException('This account uses Google Sign-In. Please sign in with Google.');
    }

    // Verify password using Argon2id
    const isValid = await argon2.verify(user.passwordHash, password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check user status
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');

    // Create session
    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + this.SESSION_MAX_AGE),
      },
    });

    // Log authentication
    await this.auditService.log({
      actorId: user.id,
      action: 'LOGIN',
      entityType: 'Session',
      entityId: user.id,
      ipAddress,
    });

    // Determine redirect path
    let redirectTo = '/workspace/dashboard';

    if (user.platformAdmin?.enabled) {
      redirectTo = '/admin/dashboard';
    } else if (user.teamMembers.length === 0) {
      redirectTo = '/no-team';
    } else if (user.teamMembers.length === 1) {
      redirectTo = '/workspace/dashboard';
    } else {
      redirectTo = '/select-team';
    }

    return {
      success: true,
      redirectTo,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
      sessionToken,
    };
  }

  async loginWithGoogle(
    profile: {
      email: string;
      name: string;
      avatarUrl?: string;
      googleId: string;
    },
    ipAddress?: string,
  ): Promise<{ sessionToken: string; redirectTo: string }> {
    let user = await this.prisma.user.findUnique({
      where: { email: profile.email.toLowerCase() },
      include: {
        platformAdmin: true,
        teamMembers: {
          where: { status: 'ACTIVE' },
          include: { team: true },
        },
      },
    });

    const normalizedEmail = profile.email.toLowerCase().trim();
    const isSuperAdminEmail = normalizedEmail === 'tharsank2@gmail.com';

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          name: profile.name,
          email: normalizedEmail,
          googleId: profile.googleId,
          avatarUrl: profile.avatarUrl,
          status: 'ACTIVE',
        },
        include: {
          platformAdmin: true,
          teamMembers: {
            where: { status: 'ACTIVE' },
            include: { team: true },
          },
        },
      });
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: profile.googleId || user.googleId,
          avatarUrl: profile.avatarUrl || user.avatarUrl,
        },
        include: {
          platformAdmin: true,
          teamMembers: {
            where: { status: 'ACTIVE' },
            include: { team: true },
          },
        },
      });
    }

    // Designate tharsank2@gmail.com as Superadmin automatically
    if (isSuperAdminEmail) {
      if (!user.platformAdmin) {
        const adminRecord = await this.prisma.platformAdmin.create({
          data: {
            userId: user.id,
            adminLevel: 'SUPER_ADMIN',
            enabled: true,
          },
        });
        user = { ...user, platformAdmin: adminRecord };
      } else if (!user.platformAdmin.enabled || user.platformAdmin.adminLevel !== 'SUPER_ADMIN') {
        const adminRecord = await this.prisma.platformAdmin.update({
          where: { userId: user.id },
          data: { enabled: true, adminLevel: 'SUPER_ADMIN' },
        });
        user = { ...user, platformAdmin: adminRecord };
      }
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    const sessionToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');

    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + this.SESSION_MAX_AGE),
      },
    });

    await this.auditService.log({
      actorId: user.id,
      action: 'LOGIN',
      entityType: 'Session',
      entityId: user.id,
      ipAddress,
      metadata: { method: 'GOOGLE_OAUTH' },
    });

    let redirectTo = '/workspace/dashboard';
    if (user.platformAdmin?.enabled) {
      redirectTo = '/admin/dashboard';
    } else if (user.teamMembers.length === 0) {
      redirectTo = '/workspace/dashboard';
    }

    return { sessionToken, redirectTo };
  }

  async logout(sessionToken: string, userId: string, ipAddress?: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');

    await this.prisma.session.delete({
      where: { tokenHash },
    });

    await this.auditService.log({
      actorId: userId,
      action: 'LOGOUT',
      entityType: 'Session',
      entityId: userId,
      ipAddress,
    });
  }

  async validateSession(sessionToken: string): Promise<boolean> {
    const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');

    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
    });

    if (!session || session.expiresAt < new Date()) {
      return false;
    }

    return true;
  }

  async getUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, avatarUrl: true },
    });
  }

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4,
    });
  }
}
