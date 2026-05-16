import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prismaService: PrismaService) {}

  private get prisma() {
    return this.prismaService.getClient() as PrismaClient;
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

  async listForUser(userId: string) {
    const establishmentId = await this.resolveEstablishmentId(userId);
    const categories = await this.prisma.category.findMany({
      where: { establishmentId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
    return categories.map((category) => ({
      id: category.categoryId,
      establishmentId: category.establishmentId,
      name: category.name,
      description: category.description ?? undefined,
      status: category.status,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));
  }

  async createForUser(userId: string, dto: CreateCategoryDto) {
    const establishmentId = await this.resolveEstablishmentId(userId);
    const duplicate = await this.prisma.category.findFirst({
      where: {
        establishmentId,
        deletedAt: null,
        name: dto.name,
      },
      select: { categoryId: true },
    });
    if (duplicate) {
      throw new BadRequestException('Category name already exists');
    }

    const category = await this.prisma.category.create({
      data: {
        establishmentId,
        name: dto.name,
        description: dto.description,
        status: dto.status,
      },
    });
    return {
      id: category.categoryId,
      establishmentId: category.establishmentId,
      name: category.name,
      description: category.description ?? undefined,
      status: category.status,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  async updateForUser(
    userId: string,
    categoryId: string,
    dto: UpdateCategoryDto,
  ) {
    const establishmentId = await this.resolveEstablishmentId(userId);
    const existing = await this.prisma.category.findFirst({
      where: { categoryId, establishmentId, deletedAt: null },
      select: { categoryId: true },
    });
    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    if (dto.name) {
      const duplicate = await this.prisma.category.findFirst({
        where: {
          establishmentId,
          deletedAt: null,
          name: dto.name,
          categoryId: { not: categoryId },
        },
        select: { categoryId: true },
      });
      if (duplicate) {
        throw new BadRequestException('Category name already exists');
      }
    }

    const category = await this.prisma.category.update({
      where: { categoryId },
      data: {
        name: dto.name,
        description: dto.description,
        status: dto.status,
      },
    });

    return {
      id: category.categoryId,
      establishmentId: category.establishmentId,
      name: category.name,
      description: category.description ?? undefined,
      status: category.status,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  async deleteForUser(userId: string, categoryId: string): Promise<void> {
    const establishmentId = await this.resolveEstablishmentId(userId);
    const existing = await this.prisma.category.findFirst({
      where: { categoryId, establishmentId, deletedAt: null },
      select: { categoryId: true },
    });
    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    const inUse = await this.prisma.product.count({
      where: {
        establishmentId,
        categoryId,
        deletedAt: null,
        status: 'active',
      },
    });
    if (inUse > 0) {
      throw new BadRequestException(
        'Cannot delete category while active products are linked',
      );
    }

    await this.prisma.category.update({
      where: { categoryId },
      data: { deletedAt: new Date() },
    });
  }
}
