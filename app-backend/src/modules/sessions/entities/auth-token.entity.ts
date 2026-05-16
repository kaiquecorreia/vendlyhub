import { User } from '../../users/entities/user.entity';

export class AuthToken {
  authTokenId!: string;
  userId!: string;
  refreshTokenHash!: string;
  expiresAt!: Date;
  revokedAt?: Date | null;
  device?: string | null;
  ip?: string | null;
  createdAt!: Date;
  user?: User;

  constructor(partial: Partial<AuthToken>) {
    Object.assign(this, partial);
  }
}
