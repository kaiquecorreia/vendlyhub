import { createHash } from 'crypto';
import { PrismaAuthTokenRepository } from './prisma.auth-token.repository';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { AuthToken } from '../../entities/auth-token.entity';
import { User } from '../../../users/entities/user.entity';

const makeTokenRecord = (overrides = {}) => ({
  authTokenId: 'token-1',
  userId: 'user-1',
  refreshTokenHash: 'hash-abc',
  expiresAt: new Date('2099-01-01'),
  revokedAt: null,
  device: null,
  ip: null,
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

const makeUserRecord = (overrides = {}) => ({
  userId: 'user-1',
  email: 'test@test.com',
  name: 'Test',
  passwordHash: 'hash',
  isActive: true,
  lastLoginAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

describe('PrismaAuthTokenRepository', () => {
  let repo: PrismaAuthTokenRepository;
  let prismaClient: {
    authToken: {
      create: jest.Mock;
      findFirst: jest.Mock;
      deleteMany: jest.Mock;
    };
  };

  beforeEach(() => {
    prismaClient = {
      authToken: {
        create: jest.fn(),
        findFirst: jest.fn(),
        deleteMany: jest.fn(),
      },
    };
    const prismaServiceMock = {
      getClient: jest.fn().mockReturnValue(prismaClient),
    } as Pick<PrismaService, 'getClient'>;
    repo = new PrismaAuthTokenRepository(prismaServiceMock as PrismaService);
  });

  describe('create()', () => {
    it('chama prisma.authToken.create e retorna AuthToken mapeado', async () => {
      const record = makeTokenRecord();
      prismaClient.authToken.create.mockResolvedValue(record);
      const data = {
        userId: 'user-1',
        refreshTokenHash: 'hash-abc',
        expiresAt: new Date('2099-01-01'),
      };
      const result = await repo.create(data);
      expect(prismaClient.authToken.create).toHaveBeenCalledWith({ data });
      expect(result).toBeInstanceOf(AuthToken);
      expect(result.authTokenId).toBe('token-1');
      expect(result.refreshTokenHash).toBe('hash-abc');
    });
  });

  describe('findByRefreshTokenHash()', () => {
    it('retorna AuthToken & { user } quando encontrado', async () => {
      const record = { ...makeTokenRecord(), user: makeUserRecord() };
      prismaClient.authToken.findFirst.mockResolvedValue(record);
      const result = await repo.findByRefreshTokenHash('hash-abc');
      expect(prismaClient.authToken.findFirst).toHaveBeenCalledWith({
        where: { refreshTokenHash: 'hash-abc' },
        include: { user: true },
      });
      expect(result).toBeInstanceOf(AuthToken);
      expect((result as any).user).toBeInstanceOf(User); // eslint-disable-line @typescript-eslint/no-unsafe-member-access
    });

    it('retorna null quando não encontrado', async () => {
      prismaClient.authToken.findFirst.mockResolvedValue(null);
      const result = await repo.findByRefreshTokenHash('missing');
      expect(result).toBeNull();
    });
  });

  describe('deleteByRefreshTokenHash()', () => {
    it('chama prisma.authToken.deleteMany com o hash correto', async () => {
      prismaClient.authToken.deleteMany.mockResolvedValue({ count: 1 });
      await repo.deleteByRefreshTokenHash('hash-abc');
      expect(prismaClient.authToken.deleteMany).toHaveBeenCalledWith({
        where: { refreshTokenHash: 'hash-abc' },
      });
    });
  });

  describe('hashToken() (static)', () => {
    it('retorna hash SHA-256 consistente', () => {
      const token = 'my-refresh-token';
      const expected = createHash('sha256').update(token).digest('hex');
      expect(PrismaAuthTokenRepository.hashToken(token)).toBe(expected);
    });
  });
});
