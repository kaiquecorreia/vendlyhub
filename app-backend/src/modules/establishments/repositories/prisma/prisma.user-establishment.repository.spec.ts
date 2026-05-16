import { PrismaUserEstablishmentRepository } from './prisma.user-establishment.repository';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { UserRole } from '@prisma/client';

describe('PrismaUserEstablishmentRepository', () => {
  let repo: PrismaUserEstablishmentRepository;
  let prismaClient: {
    userEstablishment: {
      create: jest.MockedFunction<(data: unknown) => Promise<unknown>>;
      findFirst: jest.MockedFunction<(args: unknown) => Promise<unknown>>;
    };
  };

  beforeEach(() => {
    prismaClient = {
      userEstablishment: { create: jest.fn(), findFirst: jest.fn() },
    };
    const prismaServiceMock = {
      getClient: jest.fn().mockReturnValue(prismaClient),
    } as Pick<PrismaService, 'getClient'>;
    repo = new PrismaUserEstablishmentRepository(
      prismaServiceMock as PrismaService,
    );
  });

  describe('create()', () => {
    it('chama prisma.userEstablishment.create com os dados corretos', async () => {
      prismaClient.userEstablishment.create.mockResolvedValue(undefined);
      const data = {
        userId: 'user-1',
        establishmentId: 'est-1',
        role: UserRole.owner,
      };
      await repo.create(data);
      expect(prismaClient.userEstablishment.create).toHaveBeenCalledWith({
        data,
      });
    });
  });

  describe('findByUserId()', () => {
    it('retorna o registro quando encontrado', async () => {
      const record = {
        userId: 'user-1',
        establishmentId: 'est-1',
        role: 'owner',
      };
      prismaClient.userEstablishment.findFirst.mockResolvedValue(record);
      const result = await repo.findByUserId('user-1');
      expect(prismaClient.userEstablishment.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(result).toEqual(record);
    });

    it('retorna null quando não encontrado', async () => {
      prismaClient.userEstablishment.findFirst.mockResolvedValue(null);
      const result = await repo.findByUserId('missing');
      expect(result).toBeNull();
    });
  });
});
