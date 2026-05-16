import { PrismaAuthProviderRepository } from './prisma.auth-provider.repository';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { AuthProvider } from '../../entities/auth-provider.entity';
import { AuthProviderType } from '@prisma/client';

const makeRecord = (overrides = {}) => ({
  authProviderId: 'provider-1',
  userId: 'user-1',
  provider: AuthProviderType.google,
  providerId: 'google-123',
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

describe('PrismaAuthProviderRepository', () => {
  let repo: PrismaAuthProviderRepository;
  let prismaClient: {
    authProvider: { findUnique: jest.Mock; create: jest.Mock };
  };

  beforeEach(() => {
    prismaClient = {
      authProvider: { findUnique: jest.fn(), create: jest.fn() },
    };
    const prismaServiceMock = {
      getClient: jest.fn().mockReturnValue(prismaClient),
    } as Pick<PrismaService, 'getClient'>;
    repo = new PrismaAuthProviderRepository(prismaServiceMock as PrismaService);
  });

  describe('findByProviderAndProviderId()', () => {
    it('retorna AuthProvider quando encontrado', async () => {
      const record = makeRecord();
      prismaClient.authProvider.findUnique.mockResolvedValue(record);
      const result = await repo.findByProviderAndProviderId(
        AuthProviderType.google,
        'google-123',
      );
      expect(prismaClient.authProvider.findUnique).toHaveBeenCalledWith({
        where: {
          provider_providerId: {
            provider: AuthProviderType.google,
            providerId: 'google-123',
          },
        },
      });
      expect(result).toBeInstanceOf(AuthProvider);
      expect(result?.providerId).toBe('google-123');
    });

    it('retorna null quando não encontrado', async () => {
      prismaClient.authProvider.findUnique.mockResolvedValue(null);
      const result = await repo.findByProviderAndProviderId(
        AuthProviderType.google,
        'missing',
      );
      expect(result).toBeNull();
    });
  });

  describe('findByUserIdAndProvider()', () => {
    it('retorna AuthProvider quando encontrado', async () => {
      const record = makeRecord();
      prismaClient.authProvider.findUnique.mockResolvedValue(record);
      const result = await repo.findByUserIdAndProvider(
        'user-1',
        AuthProviderType.google,
      );
      expect(prismaClient.authProvider.findUnique).toHaveBeenCalledWith({
        where: {
          userId_provider: {
            userId: 'user-1',
            provider: AuthProviderType.google,
          },
        },
      });
      expect(result).toBeInstanceOf(AuthProvider);
    });

    it('retorna null quando não encontrado', async () => {
      prismaClient.authProvider.findUnique.mockResolvedValue(null);
      const result = await repo.findByUserIdAndProvider(
        'missing',
        AuthProviderType.google,
      );
      expect(result).toBeNull();
    });
  });

  describe('create()', () => {
    it('chama prisma.authProvider.create e retorna AuthProvider mapeado', async () => {
      const record = makeRecord();
      prismaClient.authProvider.create.mockResolvedValue(record);
      const data = {
        userId: 'user-1',
        provider: AuthProviderType.google,
        providerId: 'google-123',
      };
      const result = await repo.create(data);
      expect(prismaClient.authProvider.create).toHaveBeenCalledWith({ data });
      expect(result).toBeInstanceOf(AuthProvider);
      expect(result.userId).toBe('user-1');
    });
  });
});
