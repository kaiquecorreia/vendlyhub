import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { User } from '../../users/entities/user.entity';
import { SessionsService } from '../services/sessions.service';

@Injectable()
export class LoginWithTokenUseCase {
  constructor(
    private sessionsService: SessionsService,
    private jwtService: JwtService,
  ) {}

  async execute(user: User) {
    const payload = { email: user.email, sub: user.userId };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = uuidv4();
    const refreshTokenHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    await this.sessionsService.createToken({
      userId: user.userId,
      refreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    return { access_token: accessToken, refresh_token: refreshToken };
  }
}
