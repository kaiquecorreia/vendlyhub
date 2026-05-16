export class Contact {
  contactId!: string;
  ownerType!: string;
  ownerId!: string;
  contactType!: string;
  value!: string;
  label?: string | null;
  isPrimary!: boolean;
  userId?: string | null;
  establishmentId?: string | null;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<Contact>) {
    Object.assign(this, partial);
  }
}
