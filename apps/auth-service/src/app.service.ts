import { Injectable } from '@nestjs/common';
import { prisma } from '@campus-connect/database';
import { parseStudentInfo } from '@campus-connect/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Auth Service is running!';
  }

  /**
   * Validate an OAuth login profile and upsert the user.
   * Used by the MicrosoftStrategy (passport callback).
   */
  async validateOAuthLogin(profile: {
    email: string;
    fullName: string;
    providerId: string;
    provider: string;
  }) {
    const { email, fullName } = profile;

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const info = parseStudentInfo(email);

      user = await prisma.user.create({
        data: {
          email,
          fullName,
          studentId: info.studentId,
          major: info.major,
          cohort: info.cohort,
          role: 'STUDENT',
        },
      });
    }

    return user;
  }
}
