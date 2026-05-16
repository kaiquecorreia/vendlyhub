import { NotFoundException } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { PrismaService } from '../../shared/prisma/prisma.service';

describe('CatalogService', () => {
  const establishmentId = 'a325b1c8-b707-42b6-96b3-bb74ee9079b8';
  const mobileSlug = '11999998888';

  const prismaMock = {
    establishment: {
      findFirst: jest.fn(),
    },
    contact: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
  };

  const prismaServiceMock = {
    getClient: jest.fn(() => prismaMock),
  } as unknown as PrismaService;

  const service = new CatalogService(prismaServiceMock);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('resolveEstablishmentBySlug', () => {
    it('returns company when mobile slug matches', async () => {
      prismaMock.contact.findFirst.mockResolvedValue({
        ownerId: establishmentId,
      });
      prismaMock.establishment.findFirst.mockResolvedValue({
        establishmentId,
        name: 'My Beer',
        logo: null,
        address: {
          street: 'Rua A',
          number: '1',
          neighborhood: 'Centro',
          city: 'SP',
          state: 'SP',
        },
      });
      prismaMock.contact.findMany.mockResolvedValue([{ value: '11999999999' }]);

      const result =
        await service.resolveEstablishmentBySlug('(55) 11 99999-8888');

      expect(prismaMock.contact.findFirst).toHaveBeenCalledWith({
        where: {
          ownerType: 'establishment',
          contactType: 'mobile_number',
          value: {
            in: [mobileSlug, `55${mobileSlug}`],
          },
        },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      });

      expect(prismaMock.establishment.findFirst).toHaveBeenCalledWith({
        where: {
          establishmentId,
          deletedAt: null,
          isActive: true,
        },
        include: { address: true },
      });
      expect(result.establishmentId).toBe(establishmentId);
      expect(result.company.id).toBe(establishmentId);
      expect(result.company.slug).toBe(mobileSlug);
      expect(result.company.name).toBe('My Beer');
    });

    it('accepts slug already in national format', async () => {
      prismaMock.contact.findFirst.mockResolvedValue({
        ownerId: establishmentId,
      });
      prismaMock.establishment.findFirst.mockResolvedValue({
        establishmentId,
        name: 'My Beer',
        logo: null,
        address: null,
      });
      prismaMock.contact.findMany.mockResolvedValue([{ value: mobileSlug }]);

      const result = await service.resolveEstablishmentBySlug(mobileSlug);

      expect(result.company.slug).toBe(mobileSlug);
      expect(prismaMock.contact.findFirst).toHaveBeenCalledWith({
        where: {
          ownerType: 'establishment',
          contactType: 'mobile_number',
          value: {
            in: [mobileSlug, `55${mobileSlug}`],
          },
        },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      });
    });

    it('throws NotFoundException when slug does not match mobile format', async () => {
      await expect(
        service.resolveEstablishmentBySlug('my-beer'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFoundException when mobile contact does not exist', async () => {
      prismaMock.contact.findFirst.mockResolvedValue(null);

      await expect(
        service.resolveEstablishmentBySlug(mobileSlug),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFoundException when establishment does not exist', async () => {
      prismaMock.contact.findFirst.mockResolvedValue({
        ownerId: establishmentId,
      });
      prismaMock.establishment.findFirst.mockResolvedValue(null);

      await expect(
        service.resolveEstablishmentBySlug(mobileSlug),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
