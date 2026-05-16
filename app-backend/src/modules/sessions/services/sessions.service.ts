import { Injectable, Inject } from '@nestjs/common';
import { AuthProviderType } from '@prisma/client';
import {
  IAuthTokenRepository,
  AUTH_TOKEN_REPOSITORY,
  CreateAuthTokenData,
} from '../repositories/auth-token.repository';
import {
  IAuthProviderRepository,
  AUTH_PROVIDER_REPOSITORY,
  CreateAuthProviderData,
} from '../repositories/auth-provider.repository';
import { AuthToken } from '../entities/auth-token.entity';
import { AuthProvider } from '../entities/auth-provider.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class SessionsService {
  constructor(
    @Inject(AUTH_TOKEN_REPOSITORY)
    private authTokenRepository: IAuthTokenRepository,
    @Inject(AUTH_PROVIDER_REPOSITORY)
    private authProviderRepository: IAuthProviderRepository,
  ) {}

  async createToken(data: CreateAuthTokenData): Promise<AuthToken> {
    return this.authTokenRepository.create(data);
  }

  async findTokenByHash(
    refreshTokenHash: string,
  ): Promise<(AuthToken & { user: User }) | null> {
    return this.authTokenRepository.findByRefreshTokenHash(refreshTokenHash);
  }

  async deleteTokenByHash(refreshTokenHash: string): Promise<void> {
    return this.authTokenRepository.deleteByRefreshTokenHash(refreshTokenHash);
  }

  async findProviderByProviderAndProviderId(
    provider: AuthProviderType,
    providerId: string,
  ): Promise<AuthProvider | null> {
    return this.authProviderRepository.findByProviderAndProviderId(
      provider,
      providerId,
    );
  }

  async findProviderByUserIdAndProvider(
    userId: string,
    provider: AuthProviderType,
  ): Promise<AuthProvider | null> {
    return this.authProviderRepository.findByUserIdAndProvider(
      userId,
      provider,
    );
  }

  async createProvider(data: CreateAuthProviderData): Promise<AuthProvider> {
    return this.authProviderRepository.create(data);
  }
}
