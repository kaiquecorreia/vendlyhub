import { Injectable } from '@nestjs/common';
import { AuthProviderType } from '@prisma/client';
import { UsersService } from '../../users/services/users.service';
import { SessionsService } from '../services/sessions.service';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class GoogleAuthUseCase {
  constructor(
    private usersService: UsersService,
    private sessionsService: SessionsService,
  ) {}

  async execute(
    email: string,
    name: string,
    providerId: string,
  ): Promise<User> {
    const existingProvider =
      await this.sessionsService.findProviderByProviderAndProviderId(
        AuthProviderType.google,
        providerId,
      );
    if (existingProvider) {
      return this.usersService.findById(existingProvider.userId);
    }
    let user = await this.usersService.findByEmail(email);
    if (!user) {
      user = await this.usersService.create({
        email,
        name,
        passwordHash: null,
      });
    }
    await this.sessionsService.createProvider({
      userId: user.userId,
      provider: AuthProviderType.google,
      providerId,
    });
    return user;
  }
}
