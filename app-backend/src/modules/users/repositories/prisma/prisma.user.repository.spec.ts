import { PrismaUserRepository } from './prisma.user.repository';
import { User } from '../../entities/user.entity';
import { PrismaService } from '../../../../shared/prisma/prisma.service';

const makePrismaUser = (overrides: Record<string, unknown> = {}) => ({
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

const makePrismaClient = () =>
  ({
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  }) as {
    user: {
      create: jest.MockedFunction<(data: unknown) => Promise<unknown>>;
      findUnique: jest.MockedFunction<(args: unknown) => Promise<unknown>>;
      update: jest.MockedFunction<(args: unknown) => Promise<unknown>>;
    };
  };

describe('PrismaUserRepository', () => {
  let repo: PrismaUserRepository;
  let prismaClient: ReturnType<typeof makePrismaClient>;

  beforeEach(() => {
    prismaClient = makePrismaClient();
    const prismaServiceMock = {
      getClient: jest.fn().mockReturnValue(prismaClient),
    } as Pick<PrismaService, 'getClient'>;
    repo = new PrismaUserRepository(prismaServiceMock as PrismaService);
  });

  describe('create()', () => {
    it('chama prisma.user.create e retorna User mapeado', async () => {
      const record = makePrismaUser();
      prismaClient.user.create.mockResolvedValue(record);
      const result = await repo.create({
        email: 'test@test.com',
        passwordHash: 'hash',
        name: 'Test',
      });
      expect(prismaClient.user.create).toHaveBeenCalledWith({
        data: { email: 'test@test.com', passwordHash: 'hash', name: 'Test' },
      });
      expect(result).toBeInstanceOf(User);
      expect(result.userId).toBe('user-1');
      expect(result.email).toBe('test@test.com');
    });

    it('usa passwordHash vazio string quando passwordHash é null/undefined', async () => {
      const record = makePrismaUser({ passwordHash: '' });
      prismaClient.user.create.mockResolvedValue(record);
      await repo.create({ email: 'test@test.com' });
      expect(prismaClient.user.create).toHaveBeenCalledWith({
        data: { email: 'test@test.com', passwordHash: '', name: undefined },
      });
    });
  });

  describe('findByEmail()', () => {
    it('retorna User mapeado quando encontrado', async () => {
      const record = makePrismaUser();
      prismaClient.user.findUnique.mockResolvedValue(record);
      const result = await repo.findByEmail('test@test.com');
      expect(result).toBeInstanceOf(User);
      expect(result?.email).toBe('test@test.com');
    });

    it('retorna null quando não encontrado', async () => {
      prismaClient.user.findUnique.mockResolvedValue(null);
      const result = await repo.findByEmail('none@test.com');
      expect(result).toBeNull();
    });
  });

  describe('findById()', () => {
    it('retorna User mapeado quando encontrado', async () => {
      const record = makePrismaUser();
      prismaClient.user.findUnique.mockResolvedValue(record);
      const result = await repo.findById('user-1');
      expect(result).toBeInstanceOf(User);
      expect(result?.userId).toBe('user-1');
    });

    it('retorna null quando não encontrado', async () => {
      prismaClient.user.findUnique.mockResolvedValue(null);
      const result = await repo.findById('missing');
      expect(result).toBeNull();
    });
  });

  describe('update()', () => {
    it('chama prisma.user.update e retorna User mapeado', async () => {
      const record = makePrismaUser({ name: 'Updated' });
      prismaClient.user.update.mockResolvedValue(record);
      const result = await repo.update('user-1', { name: 'Updated' });
      expect(prismaClient.user.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { name: 'Updated' },
      });
      expect(result).toBeInstanceOf(User);
      expect(result.name).toBe('Updated');
    });

    it('atualiza passwordHash quando informado', async () => {
      const record = makePrismaUser({ passwordHash: 'new' });
      prismaClient.user.update.mockResolvedValue(record);
      const result = await repo.update('user-1', { passwordHash: 'new' });
      expect(prismaClient.user.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { passwordHash: 'new' },
      });
      expect(result.passwordHash).toBe('new');
    });

    it('atualiza email quando informado', async () => {
      const record = makePrismaUser({ email: 'new@test.com' });
      prismaClient.user.update.mockResolvedValue(record);
      const result = await repo.update('user-1', { email: 'new@test.com' });
      expect(prismaClient.user.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { email: 'new@test.com' },
      });
      expect(result.email).toBe('new@test.com');
    });
  });
});
