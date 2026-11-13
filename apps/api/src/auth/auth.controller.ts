import { Controller, Post, Body, Res, Req, HttpCode, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
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

    // Set HTTP-only cookie
    res.cookie('session', result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
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

    if (sessionToken) {
      await this.authService.logout(sessionToken, user.userId, req.ip);
    }

    res.clearCookie('session');

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
}
