import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  // JwtModule is provided globally by CommonModule in AppModule.
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
