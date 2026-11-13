import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const sessionToken = request.cookies?.session;

    if (!sessionToken) {
      throw new UnauthorizedException('No session found');
    }

    // Hash the session token to compare with database
    const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');

    // Find valid session
    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            platformAdmin: true,
          },
        },
      },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await this.prisma.session.delete({ where: { id: session.id } });
      throw new UnauthorizedException('Session expired');
    }

    // Check if user is active
    if (session.user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is not active');
    }

    // Update last used timestamp
    await this.prisma.session.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    });

    // Attach user to request
    request.user = {
      userId: session.user.id,
      email: session.user.email,
      isAdmin: !!session.user.platformAdmin?.enabled,
    };

    return true;
  }
}
