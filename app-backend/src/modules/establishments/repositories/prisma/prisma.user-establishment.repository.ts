import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { PrismaClient } from '@prisma/client';
import {
  IUserEstablishmentRepository,
  CreateUserEstablishmentData,
} from '../user-establishment.repository';

@Injectable()
export class PrismaUserEstablishmentRepository
  implements IUserEstablishmentRepository
{
  constructor(private prismaService: PrismaService) {}

  private get prisma() {
    return this.prismaService.getClient() as PrismaClient;
  }

  async create(data: CreateUserEstablishmentData): Promise<void> {
    await this.prisma.userEstablishment.create({ data });
  }

  async findByUserId(
    userId: string,
  ): Promise<{ userId: string; establishmentId: string; role: string } | null> {
    const record = await this.prisma.userEstablishment.findFirst({
      where: { userId },
    });
    return record ?? null;
  }
}
