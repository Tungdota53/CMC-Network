import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-microsoft';
import { AppService } from './app.service';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(private appService: AppService) {
    super({
      clientID: process.env.MICROSOFT_CLIENT_ID || 'dummy_client_id',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || 'dummy_secret',
      callbackURL: 'http://localhost:3002/auth/microsoft/callback',
      scope: ['user.read'],
      tenant: process.env.MICROSOFT_TENANT_ID || 'common',
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: any) {
    try {
      // The profile object contains user info from Microsoft
      // We will map this to our user schema in AppService
      
      const { id, displayName, emails } = profile;
      const email = emails && emails.length > 0 ? emails[0].value : `${id}@st.cmc.edu.vn`;

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
