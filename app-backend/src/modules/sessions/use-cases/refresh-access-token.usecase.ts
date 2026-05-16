import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { SessionsService } from '../services/sessions.service';

@Injectable()
export class RefreshAccessTokenUseCase {
  constructor(
    private sessionsService: SessionsService,
    private jwtService: JwtService,
  ) {}

  async execute(refreshToken: string) {
    const refreshTokenHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    const token = await this.sessionsService.findTokenByHash(refreshTokenHash);
    if (!token || token.expiresAt < new Date())
      throw new UnauthorizedException('Invalid refresh token');
    const payload = { email: token.user.email, sub: token.user.userId };
    return { access_token: this.jwtService.sign(payload) };
  }
}
