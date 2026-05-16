import { Injectable } from '@nestjs/common';
import { compare } from 'bcrypt';
import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/services/users.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { normalizeWhatsapp } from '../utils/normalize-whatsapp';

@Injectable()
export class ValidateUserUseCase {
  constructor(
    private usersService: UsersService,
    private prismaService: PrismaService,
  ) {}

  async execute(identifier: string, password: string): Promise<User | null> {
    const user = await this.resolveUser(identifier);
    if (user && user.passwordHash) {
      const isPasswordValid = await compare(password, user.passwordHash);
      if (isPasswordValid) return user;
    }
    return null;
  }

  private async resolveUser(identifier: string): Promise<User | null> {
    if (identifier.includes('@')) {
      return this.usersService.findByEmail(identifier);
    }

    const normalizedWhatsapp = normalizeWhatsapp(identifier);
    if (!normalizedWhatsapp) return null;

    const prisma = this.prismaService.getClient();
    const link = await prisma.userEstablishment.findUnique({
      where: { loginWhatsapp: normalizedWhatsapp },
      include: { user: true },
    });
    return link?.user ?? null;
  }
}
