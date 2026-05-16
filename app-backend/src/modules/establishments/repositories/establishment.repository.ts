import { DocumentType, OnboardingStatus } from '@prisma/client';
import { Establishment } from '../entities/establishment.entity';

export const ESTABLISHMENT_REPOSITORY = 'ESTABLISHMENT_REPOSITORY';

export interface CreateEstablishmentData {
  name: string;
  document?: string;
  documentType?: DocumentType;
  /** Display names matching `establishment_type.name` (seeded list). */
  establishmentTypeNames?: string[];
  addressId: string;
  logo?: string;
  pixCopyPaste?: string;
  onboardingStatus?: OnboardingStatus;
}

export interface UpdateEstablishmentData {
  name?: string;
  document?: string;
  documentType?: DocumentType;
  /** When set, replaces all establishment–type links. */
  establishmentTypeNames?: string[];
  logo?: string;
  pixCopyPaste?: string | null;
  isActive?: boolean;
  onboardingStatus?: OnboardingStatus;
}

export interface IEstablishmentRepository {
  create(data: CreateEstablishmentData): Promise<Establishment>;
  findByEstablishmentId(establishmentId: string): Promise<Establishment | null>;
  findByUserId(userId: string): Promise<Establishment | null>;
  update(
    establishmentId: string,
    data: UpdateEstablishmentData,
  ): Promise<Establishment>;
}
