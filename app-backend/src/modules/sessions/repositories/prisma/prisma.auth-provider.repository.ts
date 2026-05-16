import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { PrismaClient, AuthProviderType } from '@prisma/client';
import {
  IAuthProviderRepository,
  CreateAuthProviderData,
} from '../auth-provider.repository';
import { AuthProvider } from '../../entities/auth-provider.entity';

@Injectable()
export class PrismaAuthProviderRepository implements IAuthProviderRepository {
  constructor(private prismaService: PrismaService) {}

  private get prisma() {
    return this.prismaService.getClient() as PrismaClient;
  }

  private mapToDomain(record: {
    authProviderId: string;
    userId: string;
    provider: string;
    providerId: string;
    createdAt: Date;
  }): AuthProvider {
    return new AuthProvider({
      authProviderId: record.authProviderId,
      userId: record.userId,
      provider: record.provider,
      providerId: record.providerId,
      createdAt: record.createdAt,
    });
  }

  async findByProviderAndProviderId(
    provider: AuthProviderType,
    providerId: string,
  ): Promise<AuthProvider | null> {
    const record = await this.prisma.authProvider.findUnique({
      where: { provider_providerId: { provider, providerId } },
    });
    return record ? this.mapToDomain(record) : null;
  }

  async findByUserIdAndProvider(
    userId: string,
    provider: AuthProviderType,
  ): Promise<AuthProvider | null> {
    const record = await this.prisma.authProvider.findUnique({
      where: { userId_provider: { userId, provider } },
    });
    return record ? this.mapToDomain(record) : null;
  }

  async create(data: CreateAuthProviderData): Promise<AuthProvider> {
    const record = await this.prisma.authProvider.create({ data });
    return this.mapToDomain(record);
  }
}
