import { GoogleAuthUseCase } from './google-auth.usecase';
import { AuthProviderType } from '@prisma/client';
import { UsersService } from '../../users/services/users.service';
import { SessionsService } from '../services/sessions.service';

const makeUser = () => ({
  userId: 'user-1',
  email: 'john@gmail.com',
  name: 'John',
});

describe('GoogleAuthUseCase', () => {
  let useCase: GoogleAuthUseCase;
  let usersService: {
    findByEmail: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
  };
  let sessionsService: {
    findProviderByProviderAndProviderId: jest.Mock;
    createProvider: jest.Mock;
  };

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };
    sessionsService = {
      findProviderByProviderAndProviderId: jest.fn(),
      createProvider: jest.fn(),
    };
    useCase = new GoogleAuthUseCase(
      usersService as unknown as UsersService,
      sessionsService as unknown as SessionsService,
    );
  });

  it('retorna usuário existente quando provider já está vinculado', async () => {
    const user = makeUser();
    const provider = {
      userId: 'user-1',
      provider: AuthProviderType.google,
      providerId: 'g-123',
    };
    sessionsService.findProviderByProviderAndProviderId.mockResolvedValue(
      provider,
    );
    usersService.findById.mockResolvedValue(user);
    const result = await useCase.execute('john@gmail.com', 'John', 'g-123');
    expect(
      sessionsService.findProviderByProviderAndProviderId,
    ).toHaveBeenCalledWith(AuthProviderType.google, 'g-123');
    expect(usersService.findById).toHaveBeenCalledWith('user-1');
    expect(result).toBe(user);
  });

  it('cria novo usuário e provider quando nenhum existe', async () => {
    const user = makeUser();
    sessionsService.findProviderByProviderAndProviderId.mockResolvedValue(null);
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue(user);
    sessionsService.createProvider.mockResolvedValue({});
    const result = await useCase.execute('john@gmail.com', 'John', 'g-new');
    expect(usersService.create).toHaveBeenCalledWith({
      email: 'john@gmail.com',
      name: 'John',
      passwordHash: null,
    });
    expect(sessionsService.createProvider).toHaveBeenCalledWith({
      userId: 'user-1',
      provider: AuthProviderType.google,
      providerId: 'g-new',
    });
    expect(result).toBe(user);
  });

  it('vincula provider a usuário existente pelo email quando provider não existe', async () => {
    const user = makeUser();
    sessionsService.findProviderByProviderAndProviderId.mockResolvedValue(null);
    usersService.findByEmail.mockResolvedValue(user);
    sessionsService.createProvider.mockResolvedValue({});
    const result = await useCase.execute('john@gmail.com', 'John', 'g-123');
    expect(usersService.create).not.toHaveBeenCalled();
    expect(sessionsService.createProvider).toHaveBeenCalledWith({
      userId: 'user-1',
      provider: AuthProviderType.google,
      providerId: 'g-123',
    });
    expect(result).toBe(user);
  });
});
