import { Test, TestingModule } from '@nestjs/testing';
import { ContactsModule } from './contacts.module';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ClsService } from '../../shared/prisma/cls.service';
import { ContactsService } from './services/contacts.service';
import { CONTACT_REPOSITORY } from './repositories/contact.repository';
import { PrismaContactRepository } from './repositories/prisma/prisma.contact.repository';

describe('ContactsModule', () => {
  let module: TestingModule;
  let prismaService: PrismaService;
  let clsService: ClsService;
  let contactsService: ContactsService;
  let contactRepository: PrismaContactRepository;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ContactsModule],
    })
      .overrideProvider(PrismaService)
      .useValue(jest.fn())
      .overrideProvider(ClsService)
      .useValue(jest.fn())
      .compile();

    prismaService = module.get<PrismaService>(PrismaService);
    clsService = module.get<ClsService>(ClsService);
    contactsService = module.get<ContactsService>(ContactsService);
    contactRepository = module.get<PrismaContactRepository>(CONTACT_REPOSITORY);
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

  it('should provide ContactsService', () => {
    expect(contactsService).toBeDefined();
  });

  it('should provide CONTACT_REPOSITORY token with PrismaContactRepository', () => {
    expect(contactRepository).toBeDefined();
    expect(contactRepository).toBeInstanceOf(PrismaContactRepository);
  });

  it('should export ContactsService', () => {
    const exportedService = module.get<ContactsService>(ContactsService);
    expect(exportedService).toBeDefined();
    expect(exportedService).toBe(contactsService);
  });

  it('should have correct module metadata', () => {
    const moduleRef = module.get(ContactsModule);
    expect(moduleRef).toBeDefined();
  });
});
