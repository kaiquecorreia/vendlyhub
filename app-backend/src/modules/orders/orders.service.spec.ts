import { BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { TransactionService } from '../../shared/prisma/transaction.service';
import { CatalogService } from '../catalog/catalog.service';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';

describe('OrdersService', () => {
  const prismaMock = {
    userEstablishment: {
      findFirst: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    order: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const prismaServiceMock = {
    getClient: jest.fn(() => prismaMock),
  } as unknown as PrismaService;

  const transactionServiceMock = {
    run: jest.fn((fn: () => Promise<unknown>) => fn()),
  } as unknown as TransactionService;

  const catalogServiceMock = {
    resolveEstablishmentBySlug: jest.fn(),
  } as unknown as CatalogService;

  const service = new OrdersService(
    prismaServiceMock,
    transactionServiceMock,
    catalogServiceMock,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when requested quantity exceeds available stock', async () => {
    (
      catalogServiceMock.resolveEstablishmentBySlug as jest.Mock
    ).mockResolvedValue({
      establishmentId: 'est-1',
    });
    prismaMock.product.findMany.mockResolvedValue([
      {
        productId: 'prd-1',
        name: 'Produto A',
        salePrice: 10,
        discount: 0,
        stockQuantity: 2,
        reservedStock: 1,
      },
    ]);

    await expect(
      service.createPublicOrder('slug', {
        customerName: 'Maria',
        customerWhatsapp: '11999999999',
        customerAddress: 'Rua A',
        items: [{ productId: 'prd-1', quantity: 2 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lists orders for authenticated user establishment', async () => {
    prismaMock.userEstablishment.findFirst.mockResolvedValue({
      establishmentId: 'est-1',
    });
    prismaMock.order.findMany.mockResolvedValue([
      {
        orderId: 'ord-1',
        establishmentId: 'est-1',
        orderNumber: 'VH-1',
        status: 'pending',
        customerName: 'Maria',
        customerWhatsapp: '11999999999',
        customerAddress: 'Rua A',
        notes: null,
        totalAmount: 50,
        createdAt: new Date('2026-01-01T10:00:00.000Z'),
        updatedAt: new Date('2026-01-01T10:00:00.000Z'),
        items: [
          {
            orderItemId: 'item-1',
            productId: 'prd-1',
            quantity: 2,
            unitPrice: 25,
            discount: 0,
            lineTotal: 50,
            product: { name: 'Produto A' },
          },
        ],
      },
    ]);

    const result = await service.listForUser(
      'user-1',
      new ListOrdersQueryDto(),
    );

    expect(prismaMock.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ establishmentId: 'est-1' }),
      }),
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'ord-1',
      status: 'pending',
      items: [{ productName: 'Produto A', quantity: 2 }],
    });
  });

  it('confirms pending order and updates product stocks', async () => {
    prismaMock.userEstablishment.findFirst.mockResolvedValue({
      establishmentId: 'est-1',
    });
    prismaMock.order.findFirst.mockResolvedValue({
      orderId: 'ord-1',
      establishmentId: 'est-1',
      status: 'pending',
      items: [
        {
          orderItemId: 'item-1',
          productId: 'prd-1',
          quantity: 2,
          unitPrice: 10,
          discount: 0,
          lineTotal: 20,
          createdAt: new Date('2026-01-01T10:00:00.000Z'),
        },
      ],
    });
    prismaMock.product.findMany.mockResolvedValue([
      {
        productId: 'prd-1',
        name: 'Produto A',
        stockQuantity: 10,
        reservedStock: 4,
      },
    ]);
    prismaMock.product.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.order.update.mockResolvedValue({
      orderId: 'ord-1',
      establishmentId: 'est-1',
      orderNumber: 'VH-1',
      status: 'confirmed',
      customerName: 'Maria',
      customerWhatsapp: '11999999999',
      customerAddress: 'Rua A',
      notes: null,
      totalAmount: 20,
      createdAt: new Date('2026-01-01T10:00:00.000Z'),
      updatedAt: new Date('2026-01-01T10:10:00.000Z'),
      items: [
        {
          orderItemId: 'item-1',
          productId: 'prd-1',
          quantity: 2,
          unitPrice: 10,
          discount: 0,
          lineTotal: 20,
          product: { name: 'Produto A' },
        },
      ],
    });

    const result = await service.confirmForUser('user-1', 'ord-1');

    expect(prismaMock.product.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          productId: 'prd-1',
        }),
      }),
    );
    expect(prismaMock.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { orderId: 'ord-1' },
        data: { status: 'confirmed' },
      }),
    );
    expect(result.status).toBe('confirmed');
  });

  it('rejects confirm action for non-pending order', async () => {
    prismaMock.userEstablishment.findFirst.mockResolvedValue({
      establishmentId: 'est-1',
    });
    prismaMock.order.findFirst.mockResolvedValue({
      orderId: 'ord-1',
      establishmentId: 'est-1',
      status: 'confirmed',
      items: [],
    });

    await expect(
      service.confirmForUser('user-1', 'ord-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
