import { UnauthorizedException } from '@nestjs/common';
import { LocalStrategy } from './local.strategy';
import { ValidateUserUseCase } from '../use-cases/validate-user.usecase';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let validateUserUseCase: { execute: jest.Mock };

  beforeEach(() => {
    validateUserUseCase = { execute: jest.fn() };
    strategy = new LocalStrategy(
      validateUserUseCase as unknown as ValidateUserUseCase,
    );
  });

  describe('validate()', () => {
    it('retorna o usuário quando credenciais são válidas', async () => {
      const user = { userId: 'user-1', email: 'test@test.com' };
      validateUserUseCase.execute.mockResolvedValue(user);
      const result = await strategy.validate('test@test.com', 'password');
      expect(validateUserUseCase.execute).toHaveBeenCalledWith(
        'test@test.com',
        'password',
      );
      expect(result).toBe(user);
    });

    it('lança UnauthorizedException quando execute retorna null', async () => {
      validateUserUseCase.execute.mockResolvedValue(null);
      await expect(strategy.validate('bad@test.com', 'wrong')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
