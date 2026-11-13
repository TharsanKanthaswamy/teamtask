import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { LoginResponse } from '@teamtrack/shared';

@Injectable()
export class AuthService {
  private readonly SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private mailService: MailService,
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

  async forgotPassword(email: string, ipAddress?: string): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Verify that user account already exists
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new NotFoundException(
        'No account was found with this email address. Please make sure your account is already created before requesting a password reset.',
      );
    }

    if (user.status !== 'ACTIVE') {
      throw new BadRequestException('This account is suspended or inactive. Please contact an administrator.');
    }

    // 2. Prevent spamming OTP requests (throttle: 60s)
    const recentToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        usedAt: null,
        createdAt: { gt: new Date(Date.now() - 60 * 1000) },
      },
    });

    if (recentToken) {
      throw new BadRequestException('A verification code was already sent recently. Please check your inbox or wait 60 seconds before requesting a new code.');
    }

    // 3. Generate 6-digit cryptographic numeric OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    // 4. Invalidate any existing unused tokens for this user
    await this.prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
    });

    // 5. Store token with 10-minute validity
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        otpHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    // 6. Send OTP via email
    await this.mailService.sendPasswordResetOtp(user.email, user.name, otp);

    // 7. Audit log
    await this.auditService.log({
      actorId: user.id,
      action: 'LOGIN',
      entityType: 'User',
      entityId: user.id,
      ipAddress,
      metadata: { event: 'PASSWORD_RESET_OTP_SENT' },
    });

    return {
      success: true,
      message: 'A 6-digit verification code has been sent to your email address.',
    };
  }

  async verifyResetOtp(email: string, otp: string): Promise<{ valid: boolean; message: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new NotFoundException('Account not found.');
    }

    const otpHash = crypto.createHash('sha256').update(otp.trim()).digest('hex');

    const token = await this.prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        otpHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!token) {
      throw new BadRequestException('Invalid or expired verification code. Please request a new one.');
    }

    return {
      valid: true,
      message: 'Verification code is valid.',
    };
  }

  async resetPassword(
    email: string,
    otp: string,
    newPassword: string,
    ipAddress?: string,
  ): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters long.');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new NotFoundException('Account not found.');
    }

    const otpHash = crypto.createHash('sha256').update(otp.trim()).digest('hex');

    const token = await this.prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        otpHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!token) {
      throw new BadRequestException('Invalid or expired verification code.');
    }

    // Hash new password using Argon2id
    const passwordHash = await this.hashPassword(newPassword);

    // Update password, mark token as used, and invalidate active sessions for security
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.session.deleteMany({
        where: { userId: user.id },
      }),
    ]);

    await this.auditService.log({
      actorId: user.id,
      action: 'LOGIN',
      entityType: 'User',
      entityId: user.id,
      ipAddress,
      metadata: { event: 'PASSWORD_RESET_SUCCESS' },
    });

    return {
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    };
  }
}
