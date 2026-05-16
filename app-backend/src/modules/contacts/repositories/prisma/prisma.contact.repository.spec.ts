import { PrismaContactRepository } from './prisma.contact.repository';
import { Contact } from '../../entities/contact.entity';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { OwnerType, ContactType } from '@prisma/client';

const makePrismaRecord = (overrides: Record<string, unknown> = {}) => ({
  contactId: 'contact-1',
  ownerType: 'establishment',
  ownerId: 'est-1',
  contactType: 'phone_number',
  value: '+5511999999999',
  label: null,
  isPrimary: false,
  userId: null,
  establishmentId: 'est-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

describe('PrismaContactRepository', () => {
  let repo: PrismaContactRepository;
  let prismaClient: {
    contact: {
      create: jest.MockedFunction<(data: unknown) => Promise<unknown>>;
      findMany: jest.MockedFunction<(args: unknown) => Promise<unknown[]>>;
    };
  };

  beforeEach(() => {
    prismaClient = {
      contact: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };
    const prismaServiceMock = {
      getClient: jest.fn().mockReturnValue(prismaClient),
    } as Pick<PrismaService, 'getClient'>;
    repo = new PrismaContactRepository(prismaServiceMock as PrismaService);
  });

  describe('create()', () => {
    it('chama prisma.contact.create e retorna Contact mapeado', async () => {
      const record = makePrismaRecord();
      prismaClient.contact.create.mockResolvedValue(record);
      const data = {
        ownerType: OwnerType.establishment,
        ownerId: 'est-1',
        contactType: ContactType.phone_number,
        value: '+5511999999999',
        establishmentId: 'est-1',
      };
      const result = await repo.create(data);
      expect(prismaClient.contact.create).toHaveBeenCalledWith({ data });
      expect(result).toBeInstanceOf(Contact);
      expect(result.contactId).toBe('contact-1');
      expect(result.value).toBe('+5511999999999');
    });
  });

  describe('findByOwnerId()', () => {
    it('retorna array de Contact mapeados', async () => {
      const records = [
        makePrismaRecord(),
        makePrismaRecord({ contactId: 'contact-2' }),
      ];
      prismaClient.contact.findMany.mockResolvedValue(records);
      const result = await repo.findByOwnerId('est-1', OwnerType.establishment);
      expect(prismaClient.contact.findMany).toHaveBeenCalledWith({
        where: { ownerId: 'est-1', ownerType: OwnerType.establishment },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Contact);
    });

    it('retorna array vazio quando não há contatos', async () => {
      prismaClient.contact.findMany.mockResolvedValue([]);
      const result = await repo.findByOwnerId('none', OwnerType.user);
      expect(result).toEqual([]);
    });
  });
});
