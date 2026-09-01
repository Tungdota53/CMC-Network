import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-microsoft';
import { AppService } from './app.service';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(private appService: AppService) {
    const microsoftEnabled = process.env.MICROSOFT_AUTH_ENABLED === 'true';
    super({
      clientID:
        microsoftEnabled && process.env.MICROSOFT_CLIENT_ID
          ? process.env.MICROSOFT_CLIENT_ID
          : 'microsoft-login-disabled',
      clientSecret:
        microsoftEnabled && process.env.MICROSOFT_CLIENT_SECRET
          ? process.env.MICROSOFT_CLIENT_SECRET
          : 'microsoft-login-disabled',
      callbackURL:
        process.env.MICROSOFT_CALLBACK_URL ||
        `${process.env.AUTH_SERVICE_PUBLIC_URL || 'http://localhost:22022'}/auth/microsoft/callback`,
      scope: ['user.read'],
      tenant: process.env.MICROSOFT_TENANT_ID || 'common',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ) {
    try {
      // The profile object contains user info from Microsoft
      // We will map this to our user schema in AppService

      const { id, displayName, emails } = profile;
      const email =
        emails && emails.length > 0 ? emails[0].value : `${id}@st.cmc.edu.vn`;

      // Pass the extracted profile data to the auth service
      const user = await this.appService.validateOAuthLogin({
        email: email,
        fullName: displayName,
        providerId: id,
        provider: 'microsoft',
      });

      done(null, user);
    } catch (err) {
      done(err, false);
    }
  }
}
