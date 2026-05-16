import { Injectable, Inject } from '@nestjs/common';
import {
  IAddressRepository,
  ADDRESS_REPOSITORY,
  CreateAddressData,
  UpdateAddressData,
} from '../repositories/address.repository';
import { Address } from '../entities/address.entity';

@Injectable()
export class AddressesService {
  constructor(
    @Inject(ADDRESS_REPOSITORY) private addressRepository: IAddressRepository,
  ) {}

  async create(data: CreateAddressData): Promise<Address> {
    return this.addressRepository.create(data);
  }

  async findById(addressId: string): Promise<Address | null> {
    return this.addressRepository.findById(addressId);
  }

  async update(addressId: string, data: UpdateAddressData): Promise<Address> {
    return this.addressRepository.update(addressId, data);
  }
}
