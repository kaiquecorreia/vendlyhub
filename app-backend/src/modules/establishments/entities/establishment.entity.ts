export class Establishment {
  establishmentId!: string;
  name!: string;
  document?: string | null;
  documentType?: string | null;
  onboardingStatus!: 'draft' | 'minimal_completed' | 'completed';
  establishmentTypes!: string[];
  pixCopyPaste?: string | null;
  logo?: string | null;
  addressId!: string;
  isActive!: boolean;
  deletedAt?: Date | null;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<Establishment>) {
    Object.assign(this, partial);
  }
}
