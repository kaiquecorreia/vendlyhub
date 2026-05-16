import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { IUserRepository, CreateUserData } from '../user.repository';
import { User } from '../../entities/user.entity';
import { PrismaClient, User as PrismaUser } from '@prisma/client';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private prismaService: PrismaService) {}

  private get prisma() {
    return this.prismaService.getClient() as PrismaClient;
  }

  private mapToDomain(prismaUser: PrismaUser): User {
    return new User({
      userId: prismaUser.userId,
      email: prismaUser.email,
      name: prismaUser.name,
      avatar: prismaUser.avatar,
      passwordHash: prismaUser.passwordHash,
      isActive: prismaUser.isActive,
      lastLoginAt: prismaUser.lastLoginAt,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    });
  }

  async create(data: CreateUserData): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash ?? '',
        name: data.name,
      },
    });
    return this.mapToDomain(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user ? this.mapToDomain(user) : null;
  }

  async findById(userId: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { userId } });
    return user ? this.mapToDomain(user) : null;
  }

  async update(
    userId: string,
    data: Partial<
      Pick<
        User,
        | 'name'
        | 'avatar'
        | 'email'
        | 'isActive'
        | 'lastLoginAt'
        | 'passwordHash'
      >
    >,
  ): Promise<User> {
    const prismaData: {
      name?: string | null;
      avatar?: string | null;
      email?: string;
      isActive?: boolean;
      lastLoginAt?: Date | null;
      passwordHash?: string;
    } = {};
    if (data.name !== undefined) prismaData.name = data.name;
    if (data.avatar !== undefined) prismaData.avatar = data.avatar;
    if (data.email !== undefined) prismaData.email = data.email;
    if (data.isActive !== undefined) prismaData.isActive = data.isActive;
    if (data.lastLoginAt !== undefined)
      prismaData.lastLoginAt = data.lastLoginAt;
    if (data.passwordHash !== undefined && data.passwordHash !== null) {
      prismaData.passwordHash = data.passwordHash;
    }
    const user = await this.prisma.user.update({
      where: { userId },
      data: prismaData,
    });
    return this.mapToDomain(user);
  }
}
