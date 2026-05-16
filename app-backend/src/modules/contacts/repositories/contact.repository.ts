import { ContactType, OwnerType } from '@prisma/client';
import { Contact } from '../entities/contact.entity';

export const CONTACT_REPOSITORY = 'CONTACT_REPOSITORY';

export interface CreateContactData {
  ownerType: OwnerType;
  ownerId: string;
  contactType: ContactType;
  value: string;
  label?: string;
  isPrimary?: boolean;
  userId?: string;
  establishmentId?: string;
}

export interface UpdateContactData {
  value?: string;
  label?: string | null;
}

export interface IContactRepository {
  create(data: CreateContactData): Promise<Contact>;
  findByOwnerId(ownerId: string, ownerType: OwnerType): Promise<Contact[]>;
  update(contactId: string, data: UpdateContactData): Promise<Contact>;
  delete(contactId: string): Promise<void>;
}
