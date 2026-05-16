import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { hash } from 'bcrypt';
import { UsersService } from '../../users/services/users.service';
import { TransactionService } from '../../../shared/prisma/transaction.service';
import { hashOpaqueToken } from '../../../shared/utils/hash-opaque-token';
import {
  IPasswordResetTokenRepository,
  PASSWORD_RESET_TOKEN_REPOSITORY,
} from '../repositories/password-reset-token.repository';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    private usersService: UsersService,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private passwordResetTokenRepository: IPasswordResetTokenRepository,
    private transactionService: TransactionService,
  ) {}

  async execute(
    token: string,
    plainPassword: string,
  ): Promise<{ message: string }> {
    const resetTokenHash = hashOpaqueToken(token);
    const row =
      await this.passwordResetTokenRepository.findValidByResetTokenHash(
        resetTokenHash,
      );
    if (!row) {
      throw new UnauthorizedException(
        'Link inválido ou expirado. Solicite uma nova redefinição de senha.',
      );
    }

    const passwordHash = await hash(plainPassword, BCRYPT_ROUNDS);

    await this.transactionService.run(async () => {
      await this.usersService.updatePasswordHash(row.userId, passwordHash);
      await this.passwordResetTokenRepository.markUsed(
        row.passwordResetTokenId,
      );
    });

    return {
      message: 'Senha alterada com sucesso. Faça login com a nova senha.',
    };
  }
}
