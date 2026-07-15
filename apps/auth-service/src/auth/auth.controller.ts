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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 5, windowMs: 60_000 })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 10, windowMs: 60_000 })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('verify-email')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 8, windowMs: 60_000 })
  async verifyEmail(@Body() body: VerifyEmailDto, @Req() req: any) {
    return this.authService.verifyEmail(body, req.ip);
  }

  @HttpCode(HttpStatus.OK)
  @Post('resend-otp')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 3, windowMs: 60_000 })
  async resendOtp(@Body() body: ResendOtpDto, @Req() req: any) {
    return this.authService.resendOtp(body, req.ip);
  }

  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 3, windowMs: 60_000 })
  async forgotPassword(@Body() body: ForgotPasswordDto, @Req() req: any) {
    return this.authService.forgotPassword(body, req.ip);
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 5, windowMs: 60_000 })
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
  async refresh(@Body() body: Partial<RefreshTokenDto> = {}) {
    return this.authService.refreshToken(body.refreshToken ?? '');
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
  async verify2FALogin(@Body() body: Partial<Verify2FALoginDto> = {}) {
    return this.authService.verify2FALogin(
      body.temp2faToken ?? '',
      body.token ?? '',
    );
  }

  @Get('microsoft')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuth() {
    // Initiates the Microsoft OAuth flow
  }

  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
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
}
