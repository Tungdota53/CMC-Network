import { Controller, Get, Post, Body, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { AppService } from './app.service';
import { RegisterDto, LoginDto } from './auth/dto/auth.dto';

@Controller('auth')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly jwtService: JwtService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.appService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const result = await this.appService.login(dto);
    const { user } = result;
    // Sign a real JWT with user id, email, and role.
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = await this.jwtService.signAsync(payload);
    return { message: result.message, access_token, user };
  }

  @Get('microsoft')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuth(@Req() _req: any) {
    // Initiates the Microsoft OAuth flow
  }

  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuthRedirect(@Req() req: any, @Res() res: any) {
    const user = req.user;
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = await this.jwtService.signAsync(payload);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const userStr = encodeURIComponent(
      JSON.stringify({ id: user.id, email: user.email, fullName: user.fullName, role: user.role }),
    );
    res.redirect(`${frontendUrl}/login?token=${token}&user=${userStr}`);
  }
}
