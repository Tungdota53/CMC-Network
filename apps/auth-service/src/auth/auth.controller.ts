import { Body, Controller, Post, HttpCode, HttpStatus, UseGuards, Get, Req, Res, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard, CurrentUser } from '@campus-connect/common';
import { AuthService } from './auth.service';
import { 
  RegisterDto, 
  LoginDto, 
  ChangePasswordDto, 
  RefreshTokenDto, 
  Verify2FAAndEnableDto, 
  Verify2FALoginDto 
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser('sub') userId: string,
    @Body() body: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, body.currentPassword, body.newPassword);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refreshToken(body.refreshToken);
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
    @Body() body: Verify2FAAndEnableDto,
  ) {
    return this.authService.verify2FAAndEnable(userId, body.token);
  }

  @HttpCode(HttpStatus.OK)
  @Post('2fa/verify-login')
  async verify2FALogin(@Body() body: Verify2FALoginDto) {
    return this.authService.verify2FALogin(body.temp2faToken, body.token);
  }

  @Get('microsoft')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuth() {
    // Initiates the Microsoft OAuth flow
  }

  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuthRedirect(@Req() req: any, @Res() res: any) {
    const user = req.user;
    
    // 6. OAuth domain whitelist
    const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS?.split(',').map((d) => d.trim().toLowerCase()) ?? [];
    const emailDomain = user.email.split('@')[1]?.toLowerCase();
    
    if (!emailDomain || !allowedDomains.includes(emailDomain)) {
      // If we don't want to throw an exception here, we can redirect to login with error,
      // but the prompt says: "Nếu domain không hợp lệ thì throw UnauthorizedException"
      throw new UnauthorizedException('Email domain is not allowed');
    }

    const tokens = await this.authService.generateTokens(user);

    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback`);
  }
}
