import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { PrismaClient } from '@prisma/client';
import {
  IContactRepository,
  CreateContactData,
  UpdateContactData,
} from '../contact.repository';
import { Contact } from '../../entities/contact.entity';

@Injectable()
export class PrismaContactRepository implements IContactRepository {
  constructor(private prismaService: PrismaService) {}

  private get prisma() {
    return this.prismaService.getClient() as PrismaClient;
  }

  private mapToDomain(record: {
    contactId: string;
    ownerType: string;
    ownerId: string;
    contactType: string;
    value: string;
    label: string | null;
    isPrimary: boolean;
    userId: string | null;
    establishmentId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Contact {
    return new Contact({
      contactId: record.contactId,
      ownerType: record.ownerType,
      ownerId: record.ownerId,
      contactType: record.contactType,
      value: record.value,
      label: record.label,
      isPrimary: record.isPrimary,
      userId: record.userId,
      establishmentId: record.establishmentId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  async create(data: CreateContactData): Promise<Contact> {
    const record = await this.prisma.contact.create({ data });
    return this.mapToDomain(record);
  }

  async findByOwnerId(
    ownerId: string,
    ownerType: import('@prisma/client').OwnerType,
  ): Promise<Contact[]> {
    const records = await this.prisma.contact.findMany({
      where: { ownerId, ownerType },
    });
    return records.map((r) => this.mapToDomain(r));
  }

  async update(contactId: string, data: UpdateContactData): Promise<Contact> {
    const record = await this.prisma.contact.update({
      where: { contactId },
      data,
    });
    return this.mapToDomain(record);
  }

  async delete(contactId: string): Promise<void> {
    await this.prisma.contact.delete({ where: { contactId } });
  }
}
