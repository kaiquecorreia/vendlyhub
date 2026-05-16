import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { User } from '../../users/entities/user.entity';
import { GoogleAuthUseCase } from '../use-cases/google-auth.usecase';

interface GoogleProfile {
  id: string;
  name: { givenName: string; familyName: string };
  emails: Array<{ value: string }>;
}

type GoogleStrategyType = new (...args: any[]) => Strategy;

@Injectable()
export class GoogleStrategy extends PassportStrategy(
  Strategy as GoogleStrategyType,
  'google',
) {
  constructor(private googleAuthUseCase: GoogleAuthUseCase) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile,
    done: (error: any, user?: User) => void,
  ): Promise<void> {
    const { name, emails } = profile;
    const user = await this.googleAuthUseCase.execute(
      emails[0].value,
      `${name.givenName} ${name.familyName}`,
      profile.id,
    );
    done(null, user);
  }
}
