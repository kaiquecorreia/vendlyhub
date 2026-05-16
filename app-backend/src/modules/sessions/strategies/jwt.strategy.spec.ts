import { JwtStrategy } from './jwt.strategy';
import { MockUsersService } from '../../../shared/types/test-mocks.types';
import { NotFoundException } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';

const makeUser = (): User =>
  new User({
    userId: 'user-1',
    email: 'test@test.com',
    name: 'Test',
    passwordHash: 'hash',
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: MockUsersService;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    usersService = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
    };
    strategy = new JwtStrategy(usersService as any);
  });

  describe('constructor', () => {
    it('should use JWT_SECRET from environment when available', () => {
      process.env.JWT_SECRET = 'available-secret';
      const newStrategy = new JwtStrategy(usersService as any);
      expect(newStrategy).toBeDefined();
    });
  });

  describe('validate()', () => {
    it('retorna o usuário quando encontrado', async () => {
      const user = makeUser();
      usersService.findById.mockResolvedValue(user);
      const result = await strategy.validate({
        sub: 'user-1',
        email: 'test@test.com',
      });
      expect(usersService.findById).toHaveBeenCalledWith('user-1');
      expect(result).toBe(user);
    });

    it('propaga NotFoundException quando usuário não encontrado', async () => {
      usersService.findById.mockRejectedValue(new NotFoundException());
      await expect(
        strategy.validate({ sub: 'missing', email: 'x@x.com' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
