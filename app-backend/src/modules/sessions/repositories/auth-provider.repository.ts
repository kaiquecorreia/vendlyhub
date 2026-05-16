import { AuthProviderType } from '@prisma/client';
import { AuthProvider } from '../entities/auth-provider.entity';

export const AUTH_PROVIDER_REPOSITORY = 'AUTH_PROVIDER_REPOSITORY';

export interface CreateAuthProviderData {
  userId: string;
  provider: AuthProviderType;
  providerId: string;
}

export interface IAuthProviderRepository {
  findByProviderAndProviderId(
    provider: AuthProviderType,
    providerId: string,
  ): Promise<AuthProvider | null>;
  findByUserIdAndProvider(
    userId: string,
    provider: AuthProviderType,
  ): Promise<AuthProvider | null>;
  create(data: CreateAuthProviderData): Promise<AuthProvider>;
}
