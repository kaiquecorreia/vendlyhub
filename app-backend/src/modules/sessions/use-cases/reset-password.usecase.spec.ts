import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ResetPasswordUseCase } from './reset-password.usecase';
import { UsersService } from '../../users/services/users.service';
import { TransactionService } from '../../../shared/prisma/transaction.service';
import { IPasswordResetTokenRepository } from '../repositories/password-reset-token.repository';
import { User } from '../../users/entities/user.entity';
import { hashOpaqueToken } from '../../../shared/utils/hash-opaque-token';

jest.mock('bcrypt');

describe('ResetPasswordUseCase', () => {
  let useCase: ResetPasswordUseCase;
  let usersService: { updatePasswordHash: jest.Mock };
  let passwordResetTokenRepository: {
    findValidByResetTokenHash: jest.Mock;
    markUsed: jest.Mock;
  };
  let transactionService: { run: jest.Mock };

  beforeEach(() => {
    usersService = {
      updatePasswordHash: jest.fn().mockResolvedValue(undefined),
    };
    passwordResetTokenRepository = {
      findValidByResetTokenHash: jest.fn(),
      markUsed: jest.fn().mockResolvedValue(undefined),
    };
    transactionService = {
      run: jest.fn(async (fn: () => Promise<void>) => fn()),
    };
    useCase = new ResetPasswordUseCase(
      usersService as unknown as UsersService,
      passwordResetTokenRepository as unknown as IPasswordResetTokenRepository,
      transactionService as unknown as TransactionService,
    );
    (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
  });

  it('lança UnauthorizedException quando token inválido', async () => {
    passwordResetTokenRepository.findValidByResetTokenHash.mockResolvedValue(
      null,
    );
    await expect(useCase.execute('bad-token', 'newpassword12')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(usersService.updatePasswordHash).not.toHaveBeenCalled();
  });

  it('atualiza senha e marca token como usado', async () => {
    const plainToken = 'plain-token-value';
    passwordResetTokenRepository.findValidByResetTokenHash.mockImplementation(
      (hash: string) => {
        expect(hash).toBe(hashOpaqueToken(plainToken));
        return Promise.resolve({
          passwordResetTokenId: 'prt-1',
          userId: 'u1',
          user: new User({
            userId: 'u1',
            email: 'a@test.com',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        });
      },
    );
    const result = await useCase.execute(plainToken, 'newpassword12');
    expect(transactionService.run).toHaveBeenCalled();
    expect(bcrypt.hash).toHaveBeenCalledWith('newpassword12', 10);
    expect(usersService.updatePasswordHash).toHaveBeenCalledWith(
      'u1',
      'new-hash',
    );
    expect(passwordResetTokenRepository.markUsed).toHaveBeenCalledWith('prt-1');
    expect(result.message).toContain('Senha alterada com sucesso');
  });
});
