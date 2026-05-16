import { Test, TestingModule } from '@nestjs/testing';
import { AddressesModule } from './addresses.module';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ClsService } from '../../shared/prisma/cls.service';
import { AddressesService } from './services/addresses.service';
import { ADDRESS_REPOSITORY } from './repositories/address.repository';
import { PrismaAddressRepository } from './repositories/prisma/prisma.address.repository';

describe('AddressesModule', () => {
  let module: TestingModule;
  let prismaService: PrismaService;
  let clsService: ClsService;
  let addressesService: AddressesService;
  let addressRepository: PrismaAddressRepository;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AddressesModule],
    })
      .overrideProvider(PrismaService)
      .useValue(jest.fn())
      .overrideProvider(ClsService)
      .useValue(jest.fn())
      .compile();

    prismaService = module.get<PrismaService>(PrismaService);
    clsService = module.get<ClsService>(ClsService);
    addressesService = module.get<AddressesService>(AddressesService);
    addressRepository = module.get<PrismaAddressRepository>(ADDRESS_REPOSITORY);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide PrismaService', () => {
    expect(prismaService).toBeDefined();
  });

  it('should provide ClsService', () => {
    expect(clsService).toBeDefined();
  });

  it('should provide AddressesService', () => {
    expect(addressesService).toBeDefined();
  });

  it('should provide ADDRESS_REPOSITORY token with PrismaAddressRepository', () => {
    expect(addressRepository).toBeDefined();
    expect(addressRepository).toBeInstanceOf(PrismaAddressRepository);
  });

  it('should export AddressesService', () => {
    const exportedService = module.get<AddressesService>(AddressesService);
    expect(exportedService).toBeDefined();
    expect(exportedService).toBe(addressesService);
  });

  it('should have correct module metadata', () => {
    const moduleRef = module.get(AddressesModule);
    expect(moduleRef).toBeDefined();
  });
});
