import { Controller, Post, Get, Query, Body, Res, Req, HttpCode, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { AuthService } from './auth.service';
import { TenantService } from '../tenant/tenant.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';
import { loginSchema, type LoginInput } from '@teamtrack/shared';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private tenantService: TenantService,
  ) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Authenticate user and create session' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() body: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Validate input
    const validated = loginSchema.parse(body);

    // Authenticate
    const result = await this.authService.login(
      validated.email,
      validated.password,
      req.ip,
    );

    // Set HTTP-only cookie (supports cross-domain Vercel frontend to Render backend)
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('session', result.sessionToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return response without session token
    const { sessionToken, ...response } = result;
    return response;
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'End user session' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(
    @CurrentUser() user: CurrentUserData,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const sessionToken = req.cookies?.session;
    const isProd = process.env.NODE_ENV === 'production';

    if (sessionToken) {
      await this.authService.logout(sessionToken, user.userId, req.ip);
    }

    res.clearCookie('session', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
    });

    return { success: true };
  }

  @Post('verify')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify current session' })
  @ApiResponse({ status: 200, description: 'Session valid' })
  async verify(@CurrentUser() user: CurrentUserData) {
    const [teams, userRecord] = await Promise.all([
      this.tenantService.getUserTeams(user.userId),
      this.authService.getUserById(user.userId),
    ]);

    return {
      success: true,
      user: {
        userId: user.userId,
        name: userRecord?.name || user.email.split('@')[0],
        email: user.email,
        avatarUrl: userRecord?.avatarUrl || null,
        isAdmin: user.isAdmin,
        teams,
      },
    };
  }

  @Get('google')
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleAuth(@Req() req: Request, @Res() res: Response) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const appUrl = process.env.APP_URL || 'https://teamtask-woad.vercel.app';

    if (!clientId) {
      return res.redirect(
        `${appUrl}/login?error=${encodeURIComponent('Google Client ID is not configured on the backend.')}`,
      );
    }

    const redirectUri =
      process.env.GOOGLE_CALLBACK_URL ||
      `${req.protocol}://${req.get('host')}/api/v1/auth/google/callback`;

    const oauth2Client = new OAuth2Client(
      clientId,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri,
    );

    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
      prompt: 'select_account',
    });

    return res.redirect(authorizeUrl);
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Handle Google OAuth callback' })
  async googleCallback(
    @Query('code') code: string,
    @Query('error') googleError: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const appUrl = process.env.APP_URL || 'https://teamtask-woad.vercel.app';

    if (googleError || !code) {
      return res.redirect(
        `${appUrl}/login?error=${encodeURIComponent(googleError || 'Google authentication was cancelled.')}`,
      );
    }

    try {
      const redirectUri =
        process.env.GOOGLE_CALLBACK_URL ||
        `${req.protocol}://${req.get('host')}/api/v1/auth/google/callback`;

      const oauth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri,
      );

      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      const ticket = await oauth2Client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new Error('Unable to retrieve email from Google profile.');
      }

      const result = await this.authService.loginWithGoogle(
        {
          email: payload.email,
          name: payload.name || payload.email.split('@')[0],
          avatarUrl: payload.picture,
          googleId: payload.sub,
        },
        req.ip,
      );

      const isProd = process.env.NODE_ENV === 'production';
      res.cookie('session', result.sessionToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.redirect(`${appUrl}${result.redirectTo}`);
    } catch (err: any) {
      return res.redirect(
        `${appUrl}/login?error=${encodeURIComponent(err.message || 'Google sign-in failed.')}`,
      );
    }
  }
}
