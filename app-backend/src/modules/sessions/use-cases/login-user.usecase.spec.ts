import { UnauthorizedException } from '@nestjs/common';
import { LoginUserUseCase } from './login-user.usecase';
import { UsersService } from '../../users/services/users.service';
import { LoginWithTokenUseCase } from './login-with-token.usecase';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

const makeUser = () => ({
  userId: 'user-1',
  email: 'test@test.com',
  passwordHash: 'hashed',
});

describe('LoginUserUseCase', () => {
  let useCase: LoginUserUseCase;
  let usersService: { findByEmail: jest.Mock };
  let loginWithTokenUseCase: { execute: jest.Mock };

  beforeEach(() => {
    usersService = { findByEmail: jest.fn() };
    loginWithTokenUseCase = { execute: jest.fn() };
    useCase = new LoginUserUseCase(
      usersService as unknown as UsersService,
      loginWithTokenUseCase as unknown as LoginWithTokenUseCase,
    );
  });

  it('valida credenciais e delega ao LoginWithTokenUseCase', async () => {
    const user = makeUser();
    usersService.findByEmail.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    loginWithTokenUseCase.execute.mockResolvedValue({
      access_token: 'jwt',
      refresh_token: 'rt',
    });
    const result = await useCase.execute('test@test.com', 'password');
    expect(loginWithTokenUseCase.execute).toHaveBeenCalledWith(user);
    expect(result).toEqual({ access_token: 'jwt', refresh_token: 'rt' });
  });

  it('lança UnauthorizedException quando usuário não tem passwordHash', async () => {
    usersService.findByEmail.mockResolvedValue({
      userId: 'user-1',
      email: 'test@test.com',
      passwordHash: null,
    });
    await expect(useCase.execute('test@test.com', 'pass')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('lança UnauthorizedException quando senha inválida', async () => {
    usersService.findByEmail.mockResolvedValue(makeUser());
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    await expect(useCase.execute('test@test.com', 'wrong')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
