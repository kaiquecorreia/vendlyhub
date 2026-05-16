import { Address } from '../entities/address.entity';

export const ADDRESS_REPOSITORY = 'ADDRESS_REPOSITORY';

export interface CreateAddressData {
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

export type UpdateAddressData = Partial<CreateAddressData>;

export interface IAddressRepository {
  create(data: CreateAddressData): Promise<Address>;
  findById(addressId: string): Promise<Address | null>;
  update(addressId: string, data: UpdateAddressData): Promise<Address>;
}
