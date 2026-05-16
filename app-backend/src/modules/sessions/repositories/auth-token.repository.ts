import { User } from '../../users/entities/user.entity';
import { AuthToken } from '../entities/auth-token.entity';

export const AUTH_TOKEN_REPOSITORY = 'AUTH_TOKEN_REPOSITORY';

export interface CreateAuthTokenData {
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  device?: string;
  ip?: string;
}

export interface IAuthTokenRepository {
  create(data: CreateAuthTokenData): Promise<AuthToken>;
  findByRefreshTokenHash(
    refreshTokenHash: string,
  ): Promise<(AuthToken & { user: User }) | null>;
  deleteByRefreshTokenHash(refreshTokenHash: string): Promise<void>;
}
