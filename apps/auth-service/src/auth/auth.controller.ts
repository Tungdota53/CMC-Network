import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Req,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  JwtAuthGuard,
  CurrentUser,
  RateLimit,
  RateLimitGuard,
} from '@campus-connect/common';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  ChangePasswordDto,
  RefreshTokenDto,
  Verify2FAAndEnableDto,
  Verify2FALoginDto,
  VerifyEmailDto,
  ResendOtpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { MicrosoftAuthEnabledGuard } from './microsoft-auth-enabled.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 5, windowMs: 15 * 60_000 })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 5, windowMs: 15 * 60_000 })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: any,
  ) {
    const result = await this.authService.login(loginDto);
    return this.setSessionCookies(res, result);
  }

  @HttpCode(HttpStatus.OK)
  @Post('verify-email')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 5, windowMs: 15 * 60_000 })
  async verifyEmail(@Body() body: VerifyEmailDto, @Req() req: any) {
    return this.authService.verifyEmail(body, req.ip);
  }

  @HttpCode(HttpStatus.OK)
  @Post('resend-otp')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 5, windowMs: 15 * 60_000 })
  async resendOtp(@Body() body: ResendOtpDto, @Req() req: any) {
    return this.authService.resendOtp(body, req.ip);
  }

  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 5, windowMs: 15 * 60_000 })
  async forgotPassword(@Body() body: ForgotPasswordDto, @Req() req: any) {
    return this.authService.forgotPassword(body, req.ip);
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 5, windowMs: 15 * 60_000 })
  async resetPassword(@Body() body: ResetPasswordDto, @Req() req: any) {
    return this.authService.resetPassword(body, req.ip);
  }

  @HttpCode(HttpStatus.OK)
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser('sub') userId: string,
    @Body() body: Partial<ChangePasswordDto> = {},
  ) {
    return this.authService.changePassword(
      userId,
      body.currentPassword ?? '',
      body.newPassword ?? '',
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 20, windowMs: 15 * 60_000 })
  async refresh(
    @Req() req: any,
    @Body() body: Partial<RefreshTokenDto> = {},
    @Res({ passthrough: true }) res: any,
  ) {
    const refreshToken = this.readCookie(req.headers.cookie, 'refresh_token');
    const result = await this.authService.refreshToken(
      refreshToken ?? body.refreshToken ?? '',
    );
    return this.setSessionCookies(res, result);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  async logout(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const refreshToken = this.readCookie(req.headers.cookie, 'refresh_token');
    if (refreshToken) await this.authService.logout(refreshToken);
    res.clearCookie('access_token', this.cookieOptions());
    res.clearCookie('refresh_token', this.cookieOptions());
  }

  @HttpCode(HttpStatus.OK)
  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  async enable2FA(@CurrentUser('sub') userId: string) {
    return this.authService.enable2FA(userId);
  }

  @HttpCode(HttpStatus.OK)
  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard)
  async verify2FAAndEnable(
    @CurrentUser('sub') userId: string,
    @Body() body: Partial<Verify2FAAndEnableDto> = {},
  ) {
    return this.authService.verify2FAAndEnable(userId, body.token ?? '');
  }

  @HttpCode(HttpStatus.OK)
  @Post('2fa/verify-login')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 5, windowMs: 15 * 60_000 })
  async verify2FALogin(
    @Body() body: Partial<Verify2FALoginDto> = {},
    @Res({ passthrough: true }) res: any,
  ) {
    const result = await this.authService.verify2FALogin(
      body.temp2faToken ?? '',
      body.token ?? '',
    );
    return this.setSessionCookies(res, result);
  }

  @Get('microsoft')
  @UseGuards(MicrosoftAuthEnabledGuard, AuthGuard('microsoft'))
  async microsoftAuth() {
    // Initiates the Microsoft OAuth flow when explicitly enabled.
  }

  @Get('microsoft/callback')
  @UseGuards(MicrosoftAuthEnabledGuard, AuthGuard('microsoft'))
  async microsoftAuthRedirect(@Req() req: any, @Res() res: any) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:25080';
    const user = req.user;

    // 6. OAuth domain whitelist
    const allowedDomains =
      process.env.ALLOWED_EMAIL_DOMAINS?.split(',').map((d) =>
        d.trim().toLowerCase(),
      ) ?? [];
    const emailDomain = user.email.split('@')[1]?.toLowerCase();

    if (
      !emailDomain ||
      (allowedDomains.length > 0 && !allowedDomains.includes(emailDomain))
    ) {
      // Redirect to frontend with error instead of throwing raw JSON
      return res.redirect(
        `${frontendUrl}/auth/callback?error=domain_not_allowed`,
      );
    }

    const tokens = await this.authService.generateTokens(user);

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    // Also set refresh_token so OAuth users don't get logged out after 15 min
    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.redirect(`${frontendUrl}/auth/callback`);
  }

  private setSessionCookies(res: any, result: any) {
    if (!result?.access_token || !result?.refresh_token) return result;
    res.cookie('access_token', result.access_token, {
      ...this.cookieOptions(),
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', result.refresh_token, {
      ...this.cookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    const safeResult = { ...result };
    delete safeResult.access_token;
    delete safeResult.refresh_token;
    return safeResult;
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };
  }

  private readCookie(cookieHeader: string | undefined, name: string) {
    const cookie = cookieHeader
      ?.split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${name}=`));
    return cookie
      ? decodeURIComponent(cookie.slice(name.length + 1))
      : undefined;
  }
}
