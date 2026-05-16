import { ValidateUserUseCase } from './validate-user.usecase';
import { UsersService } from '../../users/services/users.service';
import * as bcrypt from 'bcrypt';
import { MockUsersService } from '../../../shared/types/test.types';

jest.mock('bcrypt');

const makeUser = () => ({
  userId: 'user-1',
  email: 'test@test.com',
  passwordHash: 'hashed',
  isActive: true,
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('ValidateUserUseCase', () => {
  let useCase: ValidateUserUseCase;
  let usersService: MockUsersService;

  beforeEach(() => {
    usersService = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByEmail: jest.fn(),
    };
    useCase = new ValidateUserUseCase(usersService as unknown as UsersService);
  });

  it('retorna o usuário quando credenciais são válidas', async () => {
    const user = makeUser();
    usersService.findByEmail.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    const result = await useCase.execute('test@test.com', 'password');
    expect(result).toBe(user);
  });

  it('retorna null quando usuário não encontrado', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    const result = await useCase.execute('missing@test.com', 'password');
    expect(result).toBeNull();
  });

  it('retorna null quando senha inválida', async () => {
    const user = makeUser();
    usersService.findByEmail.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    const result = await useCase.execute('test@test.com', 'wrong');
    expect(result).toBeNull();
  });
});
