import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma, PrismaClient } from '@prisma/client';
import { TransactionService } from '../../shared/prisma/transaction.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CatalogService } from '../catalog/catalog.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly transactionService: TransactionService,
    private readonly catalogService: CatalogService,
  ) {}

  private get prisma() {
    return this.prismaService.getClient() as PrismaClient;
  }

  private toNumber(value: Prisma.Decimal | number): number {
    return Number(value);
  }

  private generateOrderNumber() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `VH-${yyyy}${mm}${dd}-${hh}${mi}-${random}`;
  }

  private async resolveEstablishmentId(userId: string): Promise<string> {
    const link = await this.prisma.userEstablishment.findFirst({
      where: { userId },
      select: { establishmentId: true },
    });

    if (!link) {
      throw new ForbiddenException('User does not belong to an establishment');
    }

    return link.establishmentId;
  }

  private serializeOrder(order: {
    orderId: string;
    establishmentId: string;
    orderNumber: string;
    status: OrderStatus;
    customerName: string;
    customerWhatsapp: string;
    customerAddress: string;
    notes: string | null;
    totalAmount: Prisma.Decimal | number;
    createdAt: Date;
    updatedAt: Date;
    items: Array<{
      orderItemId: string;
      productId: string;
      quantity: number;
      unitPrice: Prisma.Decimal | number;
      discount: Prisma.Decimal | number;
      lineTotal: Prisma.Decimal | number;
      product?: {
        name: string;
      };
    }>;
  }) {
    return {
      id: order.orderId,
      establishmentId: order.establishmentId,
      orderNumber: order.orderNumber,
      status: order.status,
      customerName: order.customerName,
      customerWhatsapp: order.customerWhatsapp,
      customerAddress: order.customerAddress,
      notes: order.notes ?? undefined,
      totalAmount: this.toNumber(order.totalAmount),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((item) => ({
        id: item.orderItemId,
        productId: item.productId,
        productName: item.product?.name,
        quantity: item.quantity,
        unitPrice: this.toNumber(item.unitPrice),
        discount: this.toNumber(item.discount),
        lineTotal: this.toNumber(item.lineTotal),
      })),
    };
  }

  async createPublicOrder(slug: string, dto: CreateOrderDto) {
    const { establishmentId } =
      await this.catalogService.resolveEstablishmentBySlug(slug);

    return this.transactionService.run(async () => {
      const productIds = dto.items.map((item) => item.productId);
      const products = await this.prisma.product.findMany({
        where: {
          establishmentId,
          productId: { in: productIds },
          deletedAt: null,
          status: 'active',
        },
      });

      if (products.length !== productIds.length) {
        throw new NotFoundException('One or more products are unavailable');
      }

      const productsById = new Map(
        products.map((product) => [product.productId, product]),
      );
      let totalAmount = 0;

      for (const item of dto.items) {
        const product = productsById.get(item.productId);
        if (!product) {
          throw new NotFoundException('Product not found');
        }
        const availableStock = product.stockQuantity - product.reservedStock;
        if (item.quantity > availableStock) {
          throw new BadRequestException(
            `Insufficient stock for product ${product.name}`,
          );
        }

        const unitPrice =
          this.toNumber(product.salePrice) - this.toNumber(product.discount);
        const lineTotal = unitPrice * item.quantity;
        totalAmount += lineTotal;
      }

      const order = await this.prisma.order.create({
        data: {
          establishmentId,
          orderNumber: this.generateOrderNumber(),
          status: 'pending',
          customerName: dto.customerName,
          customerWhatsapp: dto.customerWhatsapp,
          customerAddress: dto.customerAddress,
          notes: dto.notes,
          totalAmount,
          items: {
            create: dto.items.map((item) => {
              const product = productsById.get(item.productId)!;
              const unitPrice = this.toNumber(product.salePrice);
              const discount = this.toNumber(product.discount);
              const lineTotal = (unitPrice - discount) * item.quantity;
              return {
                productId: item.productId,
                quantity: item.quantity,
                unitPrice,
                discount,
                lineTotal,
              };
            }),
          },
        },
      });

      for (const item of dto.items) {
        await this.prisma.product.update({
          where: { productId: item.productId },
          data: {
            reservedStock: { increment: item.quantity },
          },
        });
      }

      return {
        id: order.orderId,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: this.toNumber(order.totalAmount),
        createdAt: order.createdAt,
      };
    });
  }

  async listForUser(userId: string, query: ListOrdersQueryDto) {
    const establishmentId = await this.resolveEstablishmentId(userId);
    const limit = query.limit ?? 50;

    const orders = await this.prisma.order.findMany({
      where: {
        establishmentId,
        ...(query.status ? { status: query.status } : {}),
      },
      include: {
        items: {
          include: {
            product: {
              select: { name: true },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return orders.map((order) => this.serializeOrder(order));
  }

  async confirmForUser(userId: string, orderId: string) {
    const establishmentId = await this.resolveEstablishmentId(userId);

    return this.transactionService.run(async () => {
      const order = await this.prisma.order.findFirst({
        where: {
          orderId,
          establishmentId,
        },
        include: {
          items: true,
        },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.status !== 'pending') {
        throw new BadRequestException('Only pending orders can be confirmed');
      }

      const productIds = order.items.map((item) => item.productId);
      const products = await this.prisma.product.findMany({
        where: {
          establishmentId,
          productId: { in: productIds },
        },
        select: {
          productId: true,
          name: true,
          stockQuantity: true,
          reservedStock: true,
        },
      });
      const productsById = new Map(
        products.map((product) => [product.productId, product]),
      );

      for (const item of order.items) {
        const product = productsById.get(item.productId);
        if (!product) {
          throw new NotFoundException('One or more products were not found');
        }
        if (product.reservedStock < item.quantity) {
          throw new BadRequestException(
            `Reserved stock mismatch for product ${product.name}`,
          );
        }
        if (product.stockQuantity < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product ${product.name}`,
          );
        }
      }

      for (const item of order.items) {
        const updated = await this.prisma.product.updateMany({
          where: {
            productId: item.productId,
            establishmentId,
            reservedStock: { gte: item.quantity },
            stockQuantity: { gte: item.quantity },
          },
          data: {
            stockQuantity: { decrement: item.quantity },
            reservedStock: { decrement: item.quantity },
            soldQuantity: { increment: item.quantity },
          },
        });

        if (updated.count !== 1) {
          throw new BadRequestException(
            'Could not confirm order stock changes',
          );
        }
      }

      const confirmedOrder = await this.prisma.order.update({
        where: { orderId },
        data: { status: 'confirmed' },
        include: {
          items: {
            include: {
              product: {
                select: { name: true },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

      return this.serializeOrder(confirmedOrder);
    });
  }
}
