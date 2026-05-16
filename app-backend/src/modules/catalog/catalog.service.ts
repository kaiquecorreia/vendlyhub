import { Injectable, NotFoundException } from '@nestjs/common';
import { ContactType, OwnerType, PrismaClient } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  getMobileSlugLookupCandidates,
  normalizeMobileSlug,
} from '../../shared/utils/mobile-slug';

@Injectable()
export class CatalogService {
  constructor(private readonly prismaService: PrismaService) {}

  private get prisma() {
    return this.prismaService.getClient() as PrismaClient;
  }

  private toNumber(value: unknown): number {
    return Number(value);
  }

  async resolveEstablishmentBySlug(slug: string) {
    const mobileSlug = normalizeMobileSlug(slug);
    const lookupCandidates = getMobileSlugLookupCandidates(slug);
    if (lookupCandidates.length === 0) {
      throw new NotFoundException('Empresa não encontrada');
    }

    const slugContact = await this.prisma.contact.findFirst({
      where: {
        ownerType: OwnerType.establishment,
        contactType: ContactType.mobile_number,
        value: {
          in: lookupCandidates,
        },
      },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });

    if (!slugContact) {
      throw new NotFoundException('Empresa não encontrada');
    }

    const establishment = await this.prisma.establishment.findFirst({
      where: {
        establishmentId: slugContact.ownerId,
        deletedAt: null,
        isActive: true,
      },
      include: {
        address: true,
      },
    });

    if (!establishment) {
      throw new NotFoundException('Empresa não encontrada');
    }

    const contacts = await this.prisma.contact.findMany({
      where: {
        ownerType: OwnerType.establishment,
        ownerId: establishment.establishmentId,
        contactType: ContactType.mobile_number,
      },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });

    const primaryContact = contacts[0]?.value ?? '';
    const { address } = establishment;
    const companyAddress =
      address?.street && address?.city && address?.state
        ? `${address.street}, ${address.number || 's/n'} - ${address.neighborhood || ''}, ${address.city}/${address.state}`
        : undefined;

    return {
      establishmentId: establishment.establishmentId,
      company: {
        id: establishment.establishmentId,
        slug: mobileSlug,
        name: establishment.name,
        logo: establishment.logo ?? undefined,
        whatsapp: primaryContact,
        pixCopyPaste: establishment.pixCopyPaste ?? undefined,
        address: companyAddress,
      },
    };
  }

  async getCatalog(slug: string) {
    const { establishmentId, company } =
      await this.resolveEstablishmentBySlug(slug);

    const categories = await this.prisma.category.findMany({
      where: {
        establishmentId,
        deletedAt: null,
        status: 'active',
      },
      orderBy: { name: 'asc' },
      include: {
        products: {
          where: {
            deletedAt: null,
            status: 'active',
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    return {
      company,
      categories: categories.map((category) => ({
        id: category.categoryId,
        companyId: category.establishmentId,
        name: category.name,
        description: category.description ?? undefined,
        status: category.status,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        products: category.products.map((product) => ({
          id: product.productId,
          companyId: product.establishmentId,
          name: product.name,
          sku: product.sku,
          categoryId: product.categoryId,
          categoryName: category.name,
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
          availableStock: Math.max(
            product.stockQuantity - product.reservedStock,
            0,
          ),
          isHighlighted: this.toNumber(product.discount) > 0,
        })),
      })),
    };
  }

  async getHighlightedProducts(slug: string) {
    const { establishmentId } = await this.resolveEstablishmentBySlug(slug);
    const products = await this.prisma.product.findMany({
      where: {
        establishmentId,
        deletedAt: null,
        status: 'active',
        discount: { gt: 0 },
      },
      include: {
        category: true,
      },
      orderBy: [{ discount: 'desc' }, { stockQuantity: 'desc' }],
      take: 8,
    });

    return products.map((product) => ({
      id: product.productId,
      companyId: product.establishmentId,
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
      availableStock: Math.max(
        product.stockQuantity - product.reservedStock,
        0,
      ),
      isHighlighted: true,
    }));
  }
}
