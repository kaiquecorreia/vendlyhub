import { User } from '../../users/entities/user.entity';

export const PASSWORD_RESET_TOKEN_REPOSITORY =
  'PASSWORD_RESET_TOKEN_REPOSITORY';

export interface CreatePasswordResetTokenData {
  userId: string;
  resetTokenHash: string;
  expiresAt: Date;
}

export interface ValidPasswordResetTokenRow {
  passwordResetTokenId: string;
  userId: string;
  user: User;
}

export interface IPasswordResetTokenRepository {
  deleteUnusedByUserId(userId: string): Promise<void>;
  create(data: CreatePasswordResetTokenData): Promise<void>;
  findValidByResetTokenHash(
    resetTokenHash: string,
  ): Promise<ValidPasswordResetTokenRow | null>;
  markUsed(passwordResetTokenId: string): Promise<void>;
}
