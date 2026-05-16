import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { PrismaClient } from '@prisma/client';
import {
  IAddressRepository,
  CreateAddressData,
  UpdateAddressData,
} from '../address.repository';
import { Address } from '../../entities/address.entity';

@Injectable()
export class PrismaAddressRepository implements IAddressRepository {
  constructor(private prismaService: PrismaService) {}

  private get prisma() {
    return this.prismaService.getClient() as PrismaClient;
  }

  private mapToDomain(record: {
    addressId: string;
    cep: string | null;
    street: string | null;
    number: string | null;
    complement: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
  }): Address {
    return new Address({
      addressId: record.addressId,
      cep: record.cep,
      street: record.street,
      number: record.number,
      complement: record.complement,
      neighborhood: record.neighborhood,
      city: record.city,
      state: record.state,
    });
  }

  async create(data: CreateAddressData): Promise<Address> {
    const record = await this.prisma.address.create({ data });
    return this.mapToDomain(record);
  }

  async findById(addressId: string): Promise<Address | null> {
    const record = await this.prisma.address.findUnique({
      where: { addressId },
    });
    return record ? this.mapToDomain(record) : null;
  }

  async update(addressId: string, data: UpdateAddressData): Promise<Address> {
    const record = await this.prisma.address.update({
      where: { addressId },
      data,
    });
    return this.mapToDomain(record);
  }
}
