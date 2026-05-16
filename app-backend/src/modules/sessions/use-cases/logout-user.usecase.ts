import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { SessionsService } from '../services/sessions.service';

@Injectable()
export class LogoutUserUseCase {
  constructor(private sessionsService: SessionsService) {}

  async execute(refreshToken: string): Promise<void> {
    const refreshTokenHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    await this.sessionsService.deleteTokenByHash(refreshTokenHash);
  }
}
