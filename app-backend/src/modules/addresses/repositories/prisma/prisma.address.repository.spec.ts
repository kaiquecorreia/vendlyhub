import { PrismaAddressRepository } from './prisma.address.repository';
import { Address } from '../../entities/address.entity';
import { PrismaService } from '../../../../shared/prisma/prisma.service';

const makePrismaRecord = (overrides: Record<string, unknown> = {}) => ({
  addressId: 'addr-1',
  cep: '01310-100',
  street: 'Av. Paulista',
  number: '1000',
  complement: null,
  neighborhood: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP',
  ...overrides,
});

describe('PrismaAddressRepository', () => {
  let repo: PrismaAddressRepository;
  let prismaClient: {
    address: {
      create: jest.MockedFunction<(data: unknown) => Promise<unknown>>;
      findUnique: jest.MockedFunction<(args: unknown) => Promise<unknown>>;
    };
  };

  beforeEach(() => {
    prismaClient = {
      address: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    const prismaServiceMock = {
      getClient: jest.fn().mockReturnValue(prismaClient),
    } as Pick<PrismaService, 'getClient'>;
    repo = new PrismaAddressRepository(prismaServiceMock as PrismaService);
  });

  describe('create()', () => {
    it('chama prisma.address.create e retorna Address mapeado', async () => {
      const record = makePrismaRecord();
      prismaClient.address.create.mockResolvedValue(record);
      const data = { cep: '01310-100', street: 'Av. Paulista' };
      const result = await repo.create(data);
      expect(prismaClient.address.create).toHaveBeenCalledWith({ data });
      expect(result).toBeInstanceOf(Address);
      expect(result.addressId).toBe('addr-1');
      expect(result.cep).toBe('01310-100');
    });
  });

  describe('findById()', () => {
    it('retorna Address mapeado quando encontrado', async () => {
      const record = makePrismaRecord();
      prismaClient.address.findUnique.mockResolvedValue(record);
      const result = await repo.findById('addr-1');
      expect(prismaClient.address.findUnique).toHaveBeenCalledWith({
        where: { addressId: 'addr-1' },
      });
      expect(result).toBeInstanceOf(Address);
      expect(result?.street).toBe('Av. Paulista');
    });

    it('retorna null quando não encontrado', async () => {
      prismaClient.address.findUnique.mockResolvedValue(null);
      const result = await repo.findById('missing');
      expect(result).toBeNull();
    });
  });
});
