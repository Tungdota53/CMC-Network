import { Body, Controller, Post, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser } from '@campus-connect/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: any) {
    return this.authService.register(registerDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: any) {
    return this.authService.login(loginDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser('sub') userId: string,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(userId, body.currentPassword, body.newPassword);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
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
    @Body() body: { token: string },
  ) {
    return this.authService.verify2FAAndEnable(userId, body.token);
  }

  @HttpCode(HttpStatus.OK)
  @Post('2fa/verify-login')
  async verify2FALogin(@Body() body: { userId: string; token: string }) {
    return this.authService.verify2FALogin(body.userId, body.token);
  }
}
