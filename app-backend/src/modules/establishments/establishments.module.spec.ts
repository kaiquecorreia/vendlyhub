import { Test, TestingModule } from '@nestjs/testing';
import { EstablishmentsModule } from './establishments.module';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ClsService } from '../../shared/prisma/cls.service';
import { EstablishmentsService } from './services/establishments.service';
import { ESTABLISHMENT_REPOSITORY } from './repositories/establishment.repository';
import { USER_ESTABLISHMENT_REPOSITORY } from './repositories/user-establishment.repository';
import { PrismaEstablishmentRepository } from './repositories/prisma/prisma.establishment.repository';
import { PrismaUserEstablishmentRepository } from './repositories/prisma/prisma.user-establishment.repository';

describe('EstablishmentsModule', () => {
  let module: TestingModule;
  let prismaService: PrismaService;
  let clsService: ClsService;
  let establishmentsService: EstablishmentsService;
  let establishmentRepository: PrismaEstablishmentRepository;
  let userEstablishmentRepository: PrismaUserEstablishmentRepository;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [EstablishmentsModule],
    })
      .overrideProvider(PrismaService)
      .useValue(jest.fn())
      .overrideProvider(ClsService)
      .useValue(jest.fn())
      .compile();

    prismaService = module.get<PrismaService>(PrismaService);
    clsService = module.get<ClsService>(ClsService);
    establishmentsService = module.get<EstablishmentsService>(
      EstablishmentsService,
    );
    establishmentRepository = module.get<PrismaEstablishmentRepository>(
      ESTABLISHMENT_REPOSITORY,
    );
    userEstablishmentRepository = module.get<PrismaUserEstablishmentRepository>(
      USER_ESTABLISHMENT_REPOSITORY,
    );
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

  it('should provide EstablishmentsService', () => {
    expect(establishmentsService).toBeDefined();
  });

  it('should provide ESTABLISHMENT_REPOSITORY token with PrismaEstablishmentRepository', () => {
    expect(establishmentRepository).toBeDefined();
    expect(establishmentRepository).toBeInstanceOf(
      PrismaEstablishmentRepository,
    );
  });

  it('should provide USER_ESTABLISHMENT_REPOSITORY token with PrismaUserEstablishmentRepository', () => {
    expect(userEstablishmentRepository).toBeDefined();
    expect(userEstablishmentRepository).toBeInstanceOf(
      PrismaUserEstablishmentRepository,
    );
  });

  it('should export EstablishmentsService', () => {
    const exportedService = module.get<EstablishmentsService>(
      EstablishmentsService,
    );
    expect(exportedService).toBeDefined();
    expect(exportedService).toBe(establishmentsService);
  });

  it('should have correct module metadata', () => {
    const moduleRef = module.get(EstablishmentsModule);
    expect(moduleRef).toBeDefined();
  });
});
