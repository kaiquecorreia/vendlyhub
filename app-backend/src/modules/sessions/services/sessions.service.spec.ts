import { SessionsService } from './sessions.service';
import { AuthProviderType } from '@prisma/client';

const makeAuthToken = () => ({
  authTokenId: 'token-1',
  userId: 'user-1',
  refreshTokenHash: 'hash',
});
const makeAuthProvider = () => ({
  authProviderId: 'prov-1',
  userId: 'user-1',
  provider: AuthProviderType.google,
  providerId: 'g-123',
});

describe('SessionsService', () => {
  let service: SessionsService;
  let authTokenRepo: {
    create: jest.Mock;
    findByRefreshTokenHash: jest.Mock;
    deleteByRefreshTokenHash: jest.Mock;
  };
  let authProviderRepo: {
    findByProviderAndProviderId: jest.Mock;
    findByUserIdAndProvider: jest.Mock;
    create: jest.Mock;
  };

  beforeEach(() => {
    authTokenRepo = {
      create: jest.fn(),
      findByRefreshTokenHash: jest.fn(),
      deleteByRefreshTokenHash: jest.fn(),
    };
    authProviderRepo = {
      findByProviderAndProviderId: jest.fn(),
      findByUserIdAndProvider: jest.fn(),
      create: jest.fn(),
    };
    service = new SessionsService(authTokenRepo, authProviderRepo);
  });

  describe('createToken()', () => {
    it('delega ao repositório e retorna o token criado', async () => {
      const token = makeAuthToken();
      authTokenRepo.create.mockResolvedValue(token);
      const data = {
        userId: 'user-1',
        refreshTokenHash: 'hash',
        expiresAt: new Date(),
      };
      const result = await service.createToken(data);
      expect(authTokenRepo.create).toHaveBeenCalledWith(data);
      expect(result).toBe(token);
    });
  });

  describe('findTokenByHash()', () => {
    it('retorna token com user quando encontrado', async () => {
      const token = { ...makeAuthToken(), user: { userId: 'user-1' } };
      authTokenRepo.findByRefreshTokenHash.mockResolvedValue(token);
      const result = await service.findTokenByHash('hash');
      expect(result).toBe(token);
    });

    it('retorna null quando não encontrado', async () => {
      authTokenRepo.findByRefreshTokenHash.mockResolvedValue(null);
      const result = await service.findTokenByHash('missing');
      expect(result).toBeNull();
    });
  });

  describe('deleteTokenByHash()', () => {
    it('delega ao repositório', async () => {
      authTokenRepo.deleteByRefreshTokenHash.mockResolvedValue(undefined);
      await service.deleteTokenByHash('hash');
      expect(authTokenRepo.deleteByRefreshTokenHash).toHaveBeenCalledWith(
        'hash',
      );
    });
  });

  describe('findProviderByProviderAndProviderId()', () => {
    it('retorna provider quando encontrado', async () => {
      const prov = makeAuthProvider();
      authProviderRepo.findByProviderAndProviderId.mockResolvedValue(prov);
      const result = await service.findProviderByProviderAndProviderId(
        AuthProviderType.google,
        'g-123',
      );
      expect(result).toBe(prov);
    });

    it('retorna null quando não encontrado', async () => {
      authProviderRepo.findByProviderAndProviderId.mockResolvedValue(null);
      const result = await service.findProviderByProviderAndProviderId(
        AuthProviderType.google,
        'missing',
      );
      expect(result).toBeNull();
    });
  });

  describe('findProviderByUserIdAndProvider()', () => {
    it('retorna provider quando encontrado', async () => {
      const prov = makeAuthProvider();
      authProviderRepo.findByUserIdAndProvider.mockResolvedValue(prov);
      const result = await service.findProviderByUserIdAndProvider(
        'user-1',
        AuthProviderType.google,
      );
      expect(result).toBe(prov);
    });
  });

  describe('createProvider()', () => {
    it('delega ao repositório e retorna o provider criado', async () => {
      const prov = makeAuthProvider();
      authProviderRepo.create.mockResolvedValue(prov);
      const data = {
        userId: 'user-1',
        provider: AuthProviderType.google,
        providerId: 'g-123',
      };
      const result = await service.createProvider(data);
      expect(authProviderRepo.create).toHaveBeenCalledWith(data);
      expect(result).toBe(prov);
    });
  });
});
