jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));
import { LoginWithTokenUseCase } from './login-with-token.usecase';
import {
  MockSessionsService,
  MockJwtService,
} from '../../../shared/types/test-mocks.types';
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

describe('LoginWithTokenUseCase', () => {
  let useCase: LoginWithTokenUseCase;
  let sessionsService: MockSessionsService;
  let jwtService: MockJwtService;

  beforeEach(() => {
    sessionsService = {
      createToken: jest.fn().mockResolvedValue({}),
      findTokenByHash: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('jwt-token'),
      verify: jest.fn(),
    };
    useCase = new LoginWithTokenUseCase(
      sessionsService as any,
      jwtService as any,
    );
  });

  it('gera access_token e refresh_token e persiste o hash', async () => {
    const user = makeUser();
    const result = await useCase.execute(user);
    expect(jwtService.sign).toHaveBeenCalledWith({
      email: user.email,
      sub: user.userId,
    });
    expect(sessionsService.createToken).toHaveBeenCalled();
    expect(result).toHaveProperty('access_token', 'jwt-token');
    expect(result).toHaveProperty('refresh_token');
    expect(typeof result.refresh_token).toBe('string');
  });
});
