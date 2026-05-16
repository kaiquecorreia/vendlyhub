import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient, Prisma, ProductStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import {
  ListProductsQueryDto,
  ProductSortBy,
  SortOrder,
} from './dto/list-products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';

type ProductWithCategory = Prisma.ProductGetPayload<{
  include: { category: true };
}>;

/** Used when `categoryId` is omitted on create; one per establishment via @@unique(establishmentId, name). */
export const DEFAULT_PRODUCT_CATEGORY_NAME = 'Geral';

@Injectable()
export class ProductsService {
  constructor(private readonly prismaService: PrismaService) {}

  private get prisma() {
    return this.prismaService.getClient() as PrismaClient;
  }

  private toNumber(value: Prisma.Decimal | number): number {
    return Number(value);
  }

  private computeMarginPercent(salePrice: number, cost: number): number {
    if (cost <= 0) {
      return 0;
    }
    return (
      Math.round((((salePrice - cost) / cost) * 100 + Number.EPSILON) * 100) /
      100
    );
  }

  private serialize(product: ProductWithCategory) {
    return {
      id: product.productId,
      establishmentId: product.establishmentId,
      name: product.name,
      sku: product.sku,
      categoryId: product.categoryId,
      categoryName: product.category.name,
      brand: product.brand,
      model: product.model,
      description: product.description,
      salePrice: this.toNumber(product.salePrice),
      discount: this.toNumber(product.discount),
      cost: this.toNumber(product.cost),
      margin: this.toNumber(product.margin),
      unit: product.unit,
      stockQuantity: product.stockQuantity,
      reservedStock: product.reservedStock,
      soldQuantity: product.soldQuantity,
      minStock: product.minStock,
      supplier: product.supplier,
      supplierCode: product.supplierCode ?? '',
      ean: product.ean ?? '',
      status: product.status,
      imageUrl: product.imageUrl ?? undefined,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
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

  private async assertCategoryOwnership(
    establishmentId: string,
    categoryId: string,
  ): Promise<void> {
    const category = await this.prisma.category.findFirst({
      where: {
        categoryId,
        establishmentId,
        deletedAt: null,
      },
      select: { categoryId: true },
    });
    if (!category) {
      throw new BadRequestException('Invalid category for this establishment');
    }
  }

  private async getOrCreateDefaultCategory(
    establishmentId: string,
  ): Promise<string> {
    const existing = await this.prisma.category.findFirst({
      where: {
        establishmentId,
        name: DEFAULT_PRODUCT_CATEGORY_NAME,
        deletedAt: null,
      },
      select: { categoryId: true },
    });
    if (existing) {
      return existing.categoryId;
    }

    const created = await this.prisma.category.create({
      data: {
        establishmentId,
        name: DEFAULT_PRODUCT_CATEGORY_NAME,
      },
      select: { categoryId: true },
    });
    return created.categoryId;
  }

  private async resolveSkuForCreate(
    establishmentId: string,
    requested?: string,
  ): Promise<string> {
    const trimmed = requested?.trim();
    if (trimmed) {
      const duplicate = await this.prisma.product.findFirst({
        where: {
          establishmentId,
          sku: trimmed,
          deletedAt: null,
        },
        select: { productId: true },
      });
      if (duplicate) {
        throw new BadRequestException('SKU already exists');
      }
      return trimmed;
    }

    for (let attempt = 0; attempt < 12; attempt++) {
      const sku = `AUTO-${randomUUID().replace(/-/g, '').slice(0, 12)}`;
      const duplicate = await this.prisma.product.findFirst({
        where: {
          establishmentId,
          sku,
          deletedAt: null,
        },
        select: { productId: true },
      });
      if (!duplicate) {
        return sku;
      }
    }

    throw new BadRequestException('Could not generate a unique SKU');
  }

  async listForUser(userId: string, query: ListProductsQueryDto) {
    const establishmentId = await this.resolveEstablishmentId(userId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 100;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      establishmentId,
      deletedAt: null,
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { sku: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const sortBy = query.sortBy ?? ProductSortBy.name;
    const sortOrder = query.sortOrder ?? SortOrder.asc;
    const orderBy: Prisma.ProductOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const products = await this.prisma.product.findMany({
      where,
      include: { category: true },
      orderBy,
      skip,
      take: limit,
    });

    return products.map((product) => this.serialize(product));
  }

  async getByIdForUser(userId: string, productId: string) {
    const establishmentId = await this.resolveEstablishmentId(userId);
    const product = await this.prisma.product.findFirst({
      where: {
        productId,
        establishmentId,
        deletedAt: null,
      },
      include: { category: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return this.serialize(product);
  }

  async createForUser(
    userId: string,
    dto: CreateProductDto,
    imageUrl?: string,
  ) {
    const establishmentId = await this.resolveEstablishmentId(userId);

    const categoryIdInput = dto.categoryId?.trim();
    const categoryId = categoryIdInput
      ? categoryIdInput
      : await this.getOrCreateDefaultCategory(establishmentId);
    if (categoryIdInput) {
      await this.assertCategoryOwnership(establishmentId, categoryId);
    }

    const salePrice = dto.salePrice;
    const discount = dto.discount ?? 0;
    const cost = dto.cost ?? 0;
    if (discount > salePrice) {
      throw new BadRequestException(
        'Discount cannot be greater than sale price',
      );
    }

    const sku = await this.resolveSkuForCreate(establishmentId, dto.sku);

    const margin = this.computeMarginPercent(salePrice, cost);
    const created = await this.prisma.product.create({
      data: {
        establishmentId,
        categoryId,
        name: dto.name,
        sku,
        brand: dto.brand ?? '',
        model: dto.model ?? '',
        description: dto.description ?? '',
        salePrice,
        discount,
        cost,
        margin,
        unit: dto.unit ?? '',
        stockQuantity: dto.stockQuantity ?? 0,
        reservedStock: dto.reservedStock ?? 0,
        soldQuantity: dto.soldQuantity ?? 0,
        minStock: dto.minStock ?? 0,
        supplier: dto.supplier ?? '',
        supplierCode: dto.supplierCode,
        ean: dto.ean,
        status: dto.status ?? ProductStatus.active,
        imageUrl,
      },
      include: { category: true },
    });

    return this.serialize(created);
  }

  async updateForUser(
    userId: string,
    productId: string,
    dto: UpdateProductDto,
    imageUrl?: string,
  ) {
    const establishmentId = await this.resolveEstablishmentId(userId);
    const existing = await this.prisma.product.findFirst({
      where: { productId, establishmentId, deletedAt: null },
      include: { category: true },
    });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    const nextCategoryId = dto.categoryId ?? existing.categoryId;
    await this.assertCategoryOwnership(establishmentId, nextCategoryId);

    const nextSalePrice = dto.salePrice ?? this.toNumber(existing.salePrice);
    const nextCost = dto.cost ?? this.toNumber(existing.cost);
    const nextDiscount = dto.discount ?? this.toNumber(existing.discount);
    if (nextDiscount > nextSalePrice) {
      throw new BadRequestException(
        'Discount cannot be greater than sale price',
      );
    }

    const nextSku = dto.sku ?? existing.sku;
    const duplicate = await this.prisma.product.findFirst({
      where: {
        establishmentId,
        sku: nextSku,
        deletedAt: null,
        productId: { not: productId },
      },
      select: { productId: true },
    });
    if (duplicate) {
      throw new BadRequestException('SKU already exists');
    }

    const margin = this.computeMarginPercent(nextSalePrice, nextCost);

    const updated = await this.prisma.product.update({
      where: { productId },
      data: {
        categoryId: nextCategoryId,
        name: dto.name,
        sku: dto.sku,
        brand: dto.brand,
        model: dto.model,
        description: dto.description,
        salePrice: dto.salePrice,
        discount: dto.discount,
        cost: dto.cost,
        margin,
        unit: dto.unit,
        stockQuantity: dto.stockQuantity,
        reservedStock: dto.reservedStock,
        soldQuantity: dto.soldQuantity,
        minStock: dto.minStock,
        supplier: dto.supplier,
        supplierCode: dto.supplierCode,
        ean: dto.ean,
        status: dto.status,
        ...(imageUrl ? { imageUrl } : {}),
      },
      include: { category: true },
    });

    return this.serialize(updated);
  }

  async deleteForUser(userId: string, productId: string): Promise<void> {
    const establishmentId = await this.resolveEstablishmentId(userId);
    const existing = await this.prisma.product.findFirst({
      where: { productId, establishmentId, deletedAt: null },
      select: { productId: true },
    });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.product.update({
      where: { productId },
      data: { deletedAt: new Date() },
    });
  }
}
