import { PrismaEstablishmentRepository } from './prisma.establishment.repository';
import { Establishment } from '../../entities/establishment.entity';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { DocumentType } from '@prisma/client';

const establishmentIncludeShape = {
  establishmentEstablishmentTypes: {
    include: { establishmentType: true },
  },
};

const makeRecord = (overrides: Record<string, unknown> = {}) => ({
  establishmentId: 'est-1',
  name: 'Test',
  document: '12345678000199',
  documentType: 'cnpj',
  logo: null,
  addressId: 'addr-1',
  isActive: true,
  deletedAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  establishmentEstablishmentTypes: [
    { establishmentType: { name: 'Restaurantes' } },
  ],
  ...overrides,
});

describe('PrismaEstablishmentRepository', () => {
  let repo: PrismaEstablishmentRepository;
  let prismaClient: {
    establishment: {
      create: jest.MockedFunction<(args: unknown) => Promise<unknown>>;
      findUnique: jest.MockedFunction<(args: unknown) => Promise<unknown>>;
      update: jest.MockedFunction<(args: unknown) => Promise<unknown>>;
    };
    userEstablishment: {
      findFirst: jest.MockedFunction<(args: unknown) => Promise<unknown>>;
    };
    $transaction: jest.MockedFunction<
      (fn: (tx: unknown) => Promise<unknown>) => Promise<unknown>
    >;
    establishmentType: {
      findMany: jest.MockedFunction<(args: unknown) => Promise<unknown>>;
    };
    establishmentEstablishmentType: {
      deleteMany: jest.MockedFunction<(args: unknown) => Promise<unknown>>;
      createMany: jest.MockedFunction<(args: unknown) => Promise<unknown>>;
    };
  };

  beforeEach(() => {
    prismaClient = {
      establishment: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      userEstablishment: { findFirst: jest.fn() },
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
        return fn(prismaClient);
      }),
      establishmentType: { findMany: jest.fn() },
      establishmentEstablishmentType: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
    };
    const prismaServiceMock = {
      getClient: jest.fn().mockReturnValue(prismaClient),
    } as Pick<PrismaService, 'getClient'>;
    repo = new PrismaEstablishmentRepository(
      prismaServiceMock as PrismaService,
    );
  });

  describe('create()', () => {
    it('chama prisma.establishment.create com tipos e retorna Establishment mapeado', async () => {
      const record = makeRecord();
      prismaClient.establishment.create.mockResolvedValue(record);
      const data = {
        name: 'Test',
        document: '12345678000199',
        documentType: DocumentType.cnpj,
        establishmentTypeNames: ['Restaurantes'],
        addressId: 'addr-1',
      };
      const result = await repo.create(data);
      expect(prismaClient.establishment.create).toHaveBeenCalledWith({
        data: {
          name: data.name,
          document: data.document,
          documentType: data.documentType,
          addressId: data.addressId,
          logo: undefined,
          establishmentEstablishmentTypes: {
            create: [
              { establishmentType: { connect: { name: 'Restaurantes' } } },
            ],
          },
        },
        include: establishmentIncludeShape,
      });
      expect(result).toBeInstanceOf(Establishment);
      expect(result.establishmentId).toBe('est-1');
      expect(result.establishmentTypes).toEqual(['Restaurantes']);
    });
  });

  describe('findByEstablishmentId()', () => {
    it('retorna Establishment mapeado quando encontrado', async () => {
      const record = makeRecord();
      prismaClient.establishment.findUnique.mockResolvedValue(record);
      const result = await repo.findByEstablishmentId('est-1');
      expect(result).toBeInstanceOf(Establishment);
      expect(result?.establishmentTypes).toEqual(['Restaurantes']);
    });

    it('retorna null quando não encontrado', async () => {
      prismaClient.establishment.findUnique.mockResolvedValue(null);
      const result = await repo.findByEstablishmentId('missing');
      expect(result).toBeNull();
    });
  });

  describe('findByUserId()', () => {
    it('retorna Establishment via join quando encontrado', async () => {
      const record = makeRecord();
      prismaClient.userEstablishment.findFirst.mockResolvedValue({
        establishment: record,
      });
      const result = await repo.findByUserId('user-1');
      expect(prismaClient.userEstablishment.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: {
          establishment: {
            include: establishmentIncludeShape,
          },
        },
      });
      expect(result).toBeInstanceOf(Establishment);
      expect(result?.establishmentTypes).toEqual(['Restaurantes']);
    });

    it('retorna null quando usuário não tem establishment', async () => {
      prismaClient.userEstablishment.findFirst.mockResolvedValue(null);
      const result = await repo.findByUserId('user-1');
      expect(result).toBeNull();
    });
  });

  describe('update()', () => {
    it('chama prisma.establishment.update e retorna Establishment atualizado', async () => {
      const record = makeRecord({ name: 'Updated' });
      prismaClient.establishment.update.mockResolvedValue(record);
      prismaClient.establishment.findUnique.mockResolvedValue(record);
      const result = await repo.update('est-1', { name: 'Updated' });
      expect(prismaClient.establishment.update).toHaveBeenCalledWith({
        where: { establishmentId: 'est-1' },
        data: { name: 'Updated' },
      });
      expect(result).toBeInstanceOf(Establishment);
      expect(result.name).toBe('Updated');
    });

    it('substitui tipos quando establishmentTypeNames é enviado', async () => {
      const record = makeRecord();
      prismaClient.establishmentType.findMany.mockResolvedValue([
        { establishmentTypeId: 'type-1', name: 'Restaurantes' },
      ]);
      prismaClient.establishmentEstablishmentType.deleteMany.mockResolvedValue({
        count: 1,
      });
      prismaClient.establishmentEstablishmentType.createMany.mockResolvedValue({
        count: 1,
      });
      prismaClient.establishment.update.mockResolvedValue(record);
      prismaClient.establishment.findUnique.mockResolvedValue(record);

      const result = await repo.update('est-1', {
        establishmentTypeNames: ['Restaurantes'],
      });

      expect(prismaClient.$transaction).toHaveBeenCalled();
      expect(prismaClient.establishmentType.findMany).toHaveBeenCalled();
      expect(result.establishmentTypes).toEqual(['Restaurantes']);
    });
  });
});
