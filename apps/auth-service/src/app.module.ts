import { Module } from '@nestjs/common';
import { CommonModule } from '@campus-connect/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MicrosoftStrategy } from './microsoft.strategy';
import { MicrosoftAuthEnabledGuard } from './auth/microsoft-auth-enabled.guard';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { EmailService } from './auth/email.service';

@Module({
  imports: [
    // enableAuth: false → no global JWT guard (auth routes are public by nature).
    // JwtModule is still registered globally so auth.service can sign tokens.
    CommonModule.register({ enableAuth: false }),
  ],
  controllers: [AppController, AuthController],
  providers: [
    AppService,
    AuthService,
    EmailService,
    MicrosoftStrategy,
    MicrosoftAuthEnabledGuard,
  ],
})
export class AppModule {}
