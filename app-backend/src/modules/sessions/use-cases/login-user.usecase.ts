import { Injectable, UnauthorizedException } from '@nestjs/common';
import { compare } from 'bcrypt';
import { UsersService } from '../../users/services/users.service';
import { LoginWithTokenUseCase } from './login-with-token.usecase';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { normalizeWhatsapp } from '../utils/normalize-whatsapp';

@Injectable()
export class LoginUserUseCase {
  constructor(
    private usersService: UsersService,
    private loginWithTokenUseCase: LoginWithTokenUseCase,
    private prismaService: PrismaService,
  ) {}

  async execute({
    email,
    whatsapp,
    password,
  }: {
    email?: string;
    whatsapp?: string;
    password: string;
  }) {
    const user = await this.resolveUser({ email, whatsapp });
    if (!user || !user.passwordHash)
      throw new UnauthorizedException('Invalid credentials');
    const isPasswordValid = await compare(password, user.passwordHash);
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');
    return this.loginWithTokenUseCase.execute(user);
  }

  private async resolveUser({
    email,
    whatsapp,
  }: {
    email?: string;
    whatsapp?: string;
  }) {
    if (email) {
      return this.usersService.findByEmail(email);
    }

    if (whatsapp) {
      const normalizedWhatsapp = normalizeWhatsapp(whatsapp);
      if (!normalizedWhatsapp) return null;

      const prisma = this.prismaService.getClient();
      const link = await prisma.userEstablishment.findUnique({
        where: { loginWhatsapp: normalizedWhatsapp },
        include: { user: true },
      });
      return link?.user ?? null;
    }

    return null;
  }
}
