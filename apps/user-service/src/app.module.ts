import { Module } from '@nestjs/common';
import { CommonModule } from '@campus-connect/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { MentorsModule } from './mentors/mentors.module';
import { ReputationModule } from './reputation/reputation.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { SearchModule } from './search/search.module';
import { AcademicsModule } from './academics/academics.module';
import { ProfessorsModule } from './professors/professors.module';
import { ClubsModule } from './clubs/clubs.module';

@Module({
  imports: [
    CommonModule.register({ enableAuth: false, optionalAuth: true }),
    UsersModule,
    MentorsModule,
    ReputationModule,
    NotificationsModule,
    AdminModule,
    SearchModule,
    AcademicsModule,
    ProfessorsModule,
    ClubsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
