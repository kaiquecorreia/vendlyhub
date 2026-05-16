import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { AuthController } from './auth.controller';
import { RegisterUserUseCase } from '../use-cases/register-user.usecase';
import { LoginUserUseCase } from '../use-cases/login-user.usecase';
import { RefreshAccessTokenUseCase } from '../use-cases/refresh-access-token.usecase';
import { LogoutUserUseCase } from '../use-cases/logout-user.usecase';
import { GoogleAuthUseCase } from '../use-cases/google-auth.usecase';
import { LoginWithTokenUseCase } from '../use-cases/login-with-token.usecase';
import { RequestPasswordResetUseCase } from '../use-cases/request-password-reset.usecase';
import { ResetPasswordUseCase } from '../use-cases/reset-password.usecase';
import { UsersService } from '../../users/services/users.service';
import { EstablishmentsService } from '../../establishments/services/establishments.service';
import { AddressesService } from '../../addresses/services/addresses.service';
import { ContactsService } from '../../contacts/services/contacts.service';
import { TransactionService } from '../../../shared/prisma/transaction.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { AuthGuard } from '@nestjs/passport';

describe('AuthController File Upload', () => {
  let app: INestApplication;

  const registerUseCase = { execute: jest.fn() };
  const loginUseCase = { execute: jest.fn() };
  const refreshUseCase = { execute: jest.fn() };
  const logoutUseCase = { execute: jest.fn() };
  const googleAuthUseCase = { execute: jest.fn() };
  const loginWithTokenUseCase = { execute: jest.fn() };
  const requestPasswordResetUseCase = { execute: jest.fn() };
  const resetPasswordUseCase = { execute: jest.fn() };
  const usersService = { findById: jest.fn() };
  const establishmentsService = { findByUserId: jest.fn(), update: jest.fn() };
  const addressesService = { findById: jest.fn(), update: jest.fn() };
  const contactsService = {
    findByOwnerId: jest.fn(),
    upsertEstablishmentContacts: jest.fn(),
  };
  const transactionService = {
    run: jest.fn(async (fn: () => Promise<unknown>) => fn()),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: RegisterUserUseCase, useValue: registerUseCase },
        { provide: LoginUserUseCase, useValue: loginUseCase },
        { provide: RefreshAccessTokenUseCase, useValue: refreshUseCase },
        { provide: LogoutUserUseCase, useValue: logoutUseCase },
        { provide: GoogleAuthUseCase, useValue: googleAuthUseCase },
        { provide: LoginWithTokenUseCase, useValue: loginWithTokenUseCase },
        {
          provide: RequestPasswordResetUseCase,
          useValue: requestPasswordResetUseCase,
        },
        { provide: ResetPasswordUseCase, useValue: resetPasswordUseCase },
        { provide: UsersService, useValue: usersService },
        { provide: EstablishmentsService, useValue: establishmentsService },
        { provide: AddressesService, useValue: addressesService },
        { provide: ContactsService, useValue: contactsService },
        { provide: TransactionService, useValue: transactionService },
      ],
    })
      .overrideGuard(LocalAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: any) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
          ctx.switchToHttp().getRequest().user = { userId: 'user-1' };
          return true;
        },
      })
      .overrideGuard(AuthGuard('google'))
      .useValue({
        canActivate: () => true,
      })
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register with file upload', () => {
    it('deve aceitar registro sem arquivo', async () => {
      registerUseCase.execute.mockResolvedValue({
        user: {
          userId: 'user-1',
          email: 'test@test.com',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        tokens: undefined,
      });

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'test@test.com', name: 'Test User' })
        .expect(201);

      expect(registerUseCase.execute).toHaveBeenCalledWith({
        email: 'test@test.com',
        name: 'Test User',
      });
    });

    it('deve aceitar registro com arquivo válido', async () => {
      registerUseCase.execute.mockResolvedValue({
        user: {
          userId: 'user-1',
          email: 'test@test.com',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        tokens: undefined,
      });

      const testImageBuffer = Buffer.from(
        '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A',
      );

      await request(app.getHttpServer())
        .post('/auth/register')
        .field('email', 'test@test.com')
        .field('name', 'Test User')
        .attach('logo', testImageBuffer, 'test.jpg')
        .expect(201);

      expect(registerUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@test.com',
          name: 'Test User',
          logo: expect.stringMatching(/\/uploads\/logos\/.*\.jpg$/),
        }),
      );
    });

    it('deve rejeitar arquivo de tipo inválido', async () => {
      const invalidFileBuffer = Buffer.from('invalid file content');

      await request(app.getHttpServer())
        .post('/auth/register')
        .field('email', 'test@test.com')
        .field('name', 'Test User')
        .attach('logo', invalidFileBuffer, 'test.txt')
        .expect(500);
    });
  });
});
