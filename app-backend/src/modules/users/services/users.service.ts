import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { User } from '../entities/user.entity';
import {
  IUserRepository,
  USER_REPOSITORY,
  CreateUserData,
} from '../repositories/user.repository';

export interface UpdateUserProfileInput {
  name?: string | null;
  email?: string;
  avatar?: string | null;
  currentPassword?: string;
  newPassword?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: IUserRepository,
  ) {}

  async create(data: CreateUserData): Promise<User> {
    return this.userRepository.create(data);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async findById(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(
    userId: string,
    data: Partial<Pick<User, 'name' | 'isActive' | 'lastLoginAt'>>,
  ): Promise<User> {
    return this.userRepository.update(userId, data);
  }

  async updatePasswordHash(
    userId: string,
    passwordHash: string,
  ): Promise<User> {
    return this.userRepository.update(userId, { passwordHash });
  }

  async updateProfile(
    userId: string,
    data: UpdateUserProfileInput,
  ): Promise<User> {
    const user = await this.findById(userId);
    const updates: Partial<
      Pick<User, 'name' | 'email' | 'avatar' | 'passwordHash'>
    > = {};

    if (data.name !== undefined) {
      const trimmed = data.name?.trim();
      updates.name = trimmed === '' ? null : trimmed;
    }

    if (data.avatar !== undefined) {
      updates.avatar = data.avatar;
    }

    if (data.email !== undefined) {
      const normalized = data.email.trim().toLowerCase();
      if (normalized.length === 0) {
        throw new BadRequestException('E-mail inválido');
      }
      if (normalized !== user.email.toLowerCase()) {
        const existing = await this.userRepository.findByEmail(normalized);
        if (existing && existing.userId !== userId) {
          throw new ConflictException('Email já cadastrado');
        }
        updates.email = normalized;
      }
    }

    if (data.newPassword) {
      const hasPassword =
        user.passwordHash != null && user.passwordHash.length > 0;
      if (!hasPassword) {
        throw new BadRequestException(
          'Alteração de senha não disponível para esta conta',
        );
      }
      if (!data.currentPassword) {
        throw new BadRequestException('Informe a senha atual');
      }
      const valid = await compare(data.currentPassword, user.passwordHash!);
      if (!valid) {
        throw new UnauthorizedException('Senha atual incorreta');
      }
      updates.passwordHash = await hash(data.newPassword, 10);
    }

    if (Object.keys(updates).length === 0) {
      return user;
    }

    return this.userRepository.update(userId, updates);
  }
}
