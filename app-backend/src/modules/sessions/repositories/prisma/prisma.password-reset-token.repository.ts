import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { User } from '../../../users/entities/user.entity';
import {
  CreatePasswordResetTokenData,
  IPasswordResetTokenRepository,
  ValidPasswordResetTokenRow,
} from '../password-reset-token.repository';

@Injectable()
export class PrismaPasswordResetTokenRepository
  implements IPasswordResetTokenRepository
{
  constructor(private prismaService: PrismaService) {}

  private get prisma() {
    return this.prismaService.getClient() as PrismaClient;
  }

  async deleteUnusedByUserId(userId: string): Promise<void> {
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId, usedAt: null },
    });
  }

  async create(data: CreatePasswordResetTokenData): Promise<void> {
    await this.prisma.passwordResetToken.create({
      data: {
        userId: data.userId,
        resetTokenHash: data.resetTokenHash,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findValidByResetTokenHash(
    resetTokenHash: string,
  ): Promise<ValidPasswordResetTokenRow | null> {
    const row = await this.prisma.passwordResetToken.findFirst({
      where: {
        resetTokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });
    if (!row) return null;
    return {
      passwordResetTokenId: row.passwordResetTokenId,
      userId: row.userId,
      user: new User({
        userId: row.user.userId,
        email: row.user.email,
        name: row.user.name,
        passwordHash: row.user.passwordHash,
        isActive: row.user.isActive,
        lastLoginAt: row.user.lastLoginAt,
        createdAt: row.user.createdAt,
        updatedAt: row.user.updatedAt,
      }),
    };
  }

  async markUsed(passwordResetTokenId: string): Promise<void> {
    await this.prisma.passwordResetToken.update({
      where: { passwordResetTokenId },
      data: { usedAt: new Date() },
    });
  }
}
