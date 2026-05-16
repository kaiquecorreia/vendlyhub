import { Injectable, Inject } from '@nestjs/common';
import { ContactType, OwnerType } from '@prisma/client';
import {
  IContactRepository,
  CONTACT_REPOSITORY,
  CreateContactData,
} from '../repositories/contact.repository';
import { Contact } from '../entities/contact.entity';
import { normalizeMobileSlug } from '../../../shared/utils/mobile-slug';

@Injectable()
export class ContactsService {
  constructor(
    @Inject(CONTACT_REPOSITORY) private contactRepository: IContactRepository,
  ) {}

  async create(data: CreateContactData): Promise<Contact> {
    return this.contactRepository.create({
      ...data,
      value: this.normalizeContactValue(data.contactType, data.value),
    });
  }

  async findByOwnerId(
    ownerId: string,
    ownerType: OwnerType,
  ): Promise<Contact[]> {
    return this.contactRepository.findByOwnerId(ownerId, ownerType);
  }

  /**
   * Upserts phone_number and mobile_number contacts for an establishment.
   * Empty or whitespace-only values remove the contact row if it exists.
   */
  async upsertEstablishmentContacts(
    establishmentId: string,
    phone_number?: string,
    mobile_number?: string,
  ): Promise<void> {
    const contacts = await this.contactRepository.findByOwnerId(
      establishmentId,
      OwnerType.establishment,
    );
    await this.upsertSingleContact(
      establishmentId,
      contacts,
      ContactType.phone_number,
      phone_number,
    );
    await this.upsertSingleContact(
      establishmentId,
      contacts,
      ContactType.mobile_number,
      mobile_number,
    );
  }

  private async upsertSingleContact(
    establishmentId: string,
    contacts: Contact[],
    contactType: ContactType,
    value: string | undefined,
  ): Promise<void> {
    const existing = contacts.find((c) => c.contactType === contactType);
    const trimmed = value?.trim() ?? '';
    if (!trimmed) {
      if (existing) {
        await this.contactRepository.delete(existing.contactId);
      }
      return;
    }
    if (existing) {
      await this.contactRepository.update(existing.contactId, {
        value: this.normalizeContactValue(contactType, trimmed),
      });
    } else {
      await this.contactRepository.create({
        ownerType: OwnerType.establishment,
        ownerId: establishmentId,
        contactType,
        value: this.normalizeContactValue(contactType, trimmed),
        establishmentId,
      });
    }
  }

  private normalizeContactValue(
    contactType: ContactType,
    value: string,
  ): string {
    if (contactType === ContactType.mobile_number) {
      return normalizeMobileSlug(value);
    }
    return value.trim();
  }
}
