import { Controller, Get, Post, Body, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AppService } from './app.service';

@Controller('auth')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('register')
  async register(@Body() body: any) {
    return this.appService.register(body);
  }

  @Post('login')
  async login(@Body() body: any) {
    return this.appService.login(body);
  }

  @Get('microsoft')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuth(@Req() req: any) {
    // Initiates the Microsoft OAuth flow
  }

  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuthRedirect(@Req() req: any, @Res() res: any) {
    // user is validated by MicrosoftStrategy and injected into req.user
    const user = req.user;
    
    // Create a mock JWT for now (in real app, use @nestjs/jwt)
    const token = 'mock_jwt_token_' + user.id;
    
    // Redirect back to frontend with the token
    res.redirect(`http://localhost:3000/login?token=${token}`);
  }
}
