import { UserRole } from '@prisma/client';

export const USER_ESTABLISHMENT_REPOSITORY = 'USER_ESTABLISHMENT_REPOSITORY';

export interface CreateUserEstablishmentData {
  userId: string;
  establishmentId: string;
  role: UserRole;
  loginWhatsapp?: string;
  minimalProfileCompleted?: boolean;
}

export interface IUserEstablishmentRepository {
  create(data: CreateUserEstablishmentData): Promise<void>;
  findByUserId(
    userId: string,
  ): Promise<{ userId: string; establishmentId: string; role: string } | null>;
}
