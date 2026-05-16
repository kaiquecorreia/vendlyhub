import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { PrismaClient } from '@prisma/client';
import {
  IAuthTokenRepository,
  CreateAuthTokenData,
} from '../auth-token.repository';
import { AuthToken } from '../../entities/auth-token.entity';
import { User } from '../../../users/entities/user.entity';

@Injectable()
export class PrismaAuthTokenRepository implements IAuthTokenRepository {
  constructor(private prismaService: PrismaService) {}

  private get prisma() {
    return this.prismaService.getClient() as PrismaClient;
  }

  static hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async create(data: CreateAuthTokenData): Promise<AuthToken> {
    const token = await this.prisma.authToken.create({ data });
    return new AuthToken({
      authTokenId: token.authTokenId,
      userId: token.userId,
      refreshTokenHash: token.refreshTokenHash,
      expiresAt: token.expiresAt,
      revokedAt: token.revokedAt,
      device: token.device,
      ip: token.ip,
      createdAt: token.createdAt,
    });
  }

  async findByRefreshTokenHash(
    refreshTokenHash: string,
  ): Promise<(AuthToken & { user: User }) | null> {
    const token = await this.prisma.authToken.findFirst({
      where: { refreshTokenHash },
      include: { user: true },
    });
    if (!token) return null;
    return Object.assign(
      new AuthToken({
        authTokenId: token.authTokenId,
        userId: token.userId,
        refreshTokenHash: token.refreshTokenHash,
        expiresAt: token.expiresAt,
        revokedAt: token.revokedAt,
        device: token.device,
        ip: token.ip,
        createdAt: token.createdAt,
      }),
      {
        user: new User({
          userId: token.user.userId,
          email: token.user.email,
          name: token.user.name,
          passwordHash: token.user.passwordHash,
          isActive: token.user.isActive,
          lastLoginAt: token.user.lastLoginAt,
          createdAt: token.user.createdAt,
          updatedAt: token.user.updatedAt,
        }),
      },
    );
  }

  async deleteByRefreshTokenHash(refreshTokenHash: string): Promise<void> {
    await this.prisma.authToken.deleteMany({ where: { refreshTokenHash } });
  }
}
