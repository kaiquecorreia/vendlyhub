import { Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { UsersService } from '../../users/services/users.service';
import { MailService } from '../services/mail.service';
import { hashOpaqueToken } from '../../../shared/utils/hash-opaque-token';
import {
  IPasswordResetTokenRepository,
  PASSWORD_RESET_TOKEN_REPOSITORY,
} from '../repositories/password-reset-token.repository';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class RequestPasswordResetUseCase {
  constructor(
    private usersService: UsersService,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private passwordResetTokenRepository: IPasswordResetTokenRepository,
    private mailService: MailService,
  ) {}

  async execute(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user?.passwordHash) {
      return {
        message: 'Se existir uma conta com este e-mail, enviaremos instruções.',
      };
    }

    const plainToken = randomBytes(32).toString('hex');
    const resetTokenHash = hashOpaqueToken(plainToken);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await this.passwordResetTokenRepository.deleteUnusedByUserId(user.userId);
    await this.passwordResetTokenRepository.create({
      userId: user.userId,
      resetTokenHash,
      expiresAt,
    });

    const frontendUrl = (
      process.env.FRONTEND_URL || 'http://localhost:3000'
    ).replace(/\/$/, '');
    const resetUrl = `${frontendUrl}/redefinir-senha?token=${encodeURIComponent(plainToken)}`;

    await this.mailService.sendPasswordResetEmail(user.email, resetUrl);

    return {
      message: 'Se existir uma conta com este e-mail, enviaremos instruções.',
    };
  }
}
