import { RequestPasswordResetUseCase } from './request-password-reset.usecase';
import { UsersService } from '../../users/services/users.service';
import { MailService } from '../services/mail.service';
import { IPasswordResetTokenRepository } from '../repositories/password-reset-token.repository';
import { User } from '../../users/entities/user.entity';

describe('RequestPasswordResetUseCase', () => {
  let useCase: RequestPasswordResetUseCase;
  let usersService: { findByEmail: jest.Mock };
  let passwordResetTokenRepository: {
    deleteUnusedByUserId: jest.Mock;
    create: jest.Mock;
  };
  let mailService: { sendPasswordResetEmail: jest.Mock };

  beforeEach(() => {
    usersService = { findByEmail: jest.fn() };
    passwordResetTokenRepository = {
      deleteUnusedByUserId: jest.fn().mockResolvedValue(undefined),
      create: jest.fn().mockResolvedValue(undefined),
    };
    mailService = {
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new RequestPasswordResetUseCase(
      usersService as unknown as UsersService,
      passwordResetTokenRepository as unknown as IPasswordResetTokenRepository,
      mailService as unknown as MailService,
    );
    process.env.FRONTEND_URL = 'http://localhost:3000';
  });

  it('retorna mensagem genérica e não envia e-mail quando usuário não existe', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    const result = await useCase.execute('missing@test.com');
    expect(result.message).toContain('Se existir uma conta');
    expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    expect(passwordResetTokenRepository.create).not.toHaveBeenCalled();
  });

  it('retorna mensagem genérica quando usuário não tem senha (OAuth)', async () => {
    usersService.findByEmail.mockResolvedValue(
      new User({
        userId: 'u1',
        email: 'a@test.com',
        passwordHash: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
    const result = await useCase.execute('a@test.com');
    expect(result.message).toContain('Se existir uma conta');
    expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('cria token, invalida anteriores e envia e-mail quando usuário tem senha', async () => {
    usersService.findByEmail.mockResolvedValue(
      new User({
        userId: 'u1',
        email: 'a@test.com',
        passwordHash: 'hash',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
    const result = await useCase.execute('a@test.com');
    expect(result.message).toContain('Se existir uma conta');
    expect(
      passwordResetTokenRepository.deleteUnusedByUserId,
    ).toHaveBeenCalledWith('u1');
    expect(passwordResetTokenRepository.create).toHaveBeenCalledWith({
      userId: 'u1',
      resetTokenHash: expect.any(String),
      expiresAt: expect.any(Date),
    });
    expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith(
      'a@test.com',
      expect.stringMatching(/\/redefinir-senha\?token=/),
    );
  });
});
