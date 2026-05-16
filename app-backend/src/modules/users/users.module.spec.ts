import { Test, TestingModule } from '@nestjs/testing';
import { UsersModule } from './users.module';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ClsService } from '../../shared/prisma/cls.service';
import { UsersService } from './services/users.service';
import { USER_REPOSITORY } from './repositories/user.repository';
import { PrismaUserRepository } from './repositories/prisma/prisma.user.repository';

describe('UsersModule', () => {
  let module: TestingModule;
  let prismaService: PrismaService;
  let clsService: ClsService;
  let usersService: UsersService;
  let userRepository: PrismaUserRepository;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [UsersModule],
    })
      .overrideProvider(PrismaService)
      .useValue(jest.fn())
      .overrideProvider(ClsService)
      .useValue(jest.fn())
      .compile();

    prismaService = module.get<PrismaService>(PrismaService);
    clsService = module.get<ClsService>(ClsService);
    usersService = module.get<UsersService>(UsersService);
    userRepository = module.get<PrismaUserRepository>(USER_REPOSITORY);
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

  it('should provide UsersService', () => {
    expect(usersService).toBeDefined();
  });

  it('should provide USER_REPOSITORY token with PrismaUserRepository', () => {
    expect(userRepository).toBeDefined();
    expect(userRepository).toBeInstanceOf(PrismaUserRepository);
  });

  it('should export UsersService', () => {
    const exportedService = module.get<UsersService>(UsersService);
    expect(exportedService).toBeDefined();
    expect(exportedService).toBe(usersService);
  });

  it('should have correct module metadata', () => {
    const moduleRef = module.get(UsersModule);
    expect(moduleRef).toBeDefined();
  });
});
