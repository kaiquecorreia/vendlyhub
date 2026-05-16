import { AddressesService } from './addresses.service';
import { Address } from '../entities/address.entity';
import {
  createMockAddressRepository,
  MockAddressRepository,
} from '../../../shared/types/test.types';

const makeAddress = (overrides: Partial<Address> = {}): Address =>
  new Address({
    addressId: 'addr-1',
    cep: '01310-100',
    street: 'Av. Paulista',
    number: '1000',
    complement: null,
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    ...overrides,
  });

describe('AddressesService', () => {
  let service: AddressesService;
  let addressRepository: MockAddressRepository;

  beforeEach(() => {
    addressRepository = createMockAddressRepository();
    service = new AddressesService(addressRepository);
  });

  describe('create()', () => {
    it('delega ao repositório e retorna o endereço criado', async () => {
      const address = makeAddress();
      addressRepository.create.mockResolvedValue(address);
      const data = { cep: '01310-100', street: 'Av. Paulista' };
      const result = await service.create(data);
      expect(addressRepository.create).toHaveBeenCalledWith(data);
      expect(result).toBe(address);
    });
  });

  describe('findById()', () => {
    it('retorna o endereço quando encontrado', async () => {
      const address = makeAddress();
      addressRepository.findById.mockResolvedValue(address);
      const result = await service.findById('addr-1');
      expect(result).toBe(address);
    });

    it('retorna null quando não encontrado', async () => {
      addressRepository.findById.mockResolvedValue(null);
      const result = await service.findById('missing');
      expect(result).toBeNull();
    });
  });

  describe('update()', () => {
    it('delega ao repositório e retorna o endereço atualizado', async () => {
      const address = makeAddress();
      addressRepository.update.mockResolvedValue(address);
      const data = { cep: '01310-100' };
      const result = await service.update('addr-1', data);
      expect(addressRepository.update).toHaveBeenCalledWith('addr-1', data);
      expect(result).toBe(address);
    });
  });
});
