import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Server } from 'http';
import { Request } from 'express';
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

// Define proper server type
type HttpServer = Server;

// Define request interface for guard mocks
interface AuthenticatedRequest extends Request {
  user: {
    userId?: string;
    email?: string;
    name?: string;
    id?: string;
  };
}

// Define ExecutionContext interface
interface MockExecutionContext {
  switchToHttp: () => {
    getRequest: () => AuthenticatedRequest;
  };
}

const mockTokens = { access_token: 'jwt', refresh_token: 'rt' };
const mockUser = { userId: 'user-1', name: 'Test', email: 'test@test.com' };

describe('AuthController (integration)', () => {
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
        canActivate: (ctx: MockExecutionContext) => {
          const req = ctx.switchToHttp().getRequest();
          req.user = { userId: 'user-1' };
          return true;
        },
      })
      .overrideGuard(AuthGuard('google'))
      .useValue({
        canActivate: (ctx: MockExecutionContext) => {
          const req = ctx.switchToHttp().getRequest();
          req.user = {
            email: 'test@test.com',
            name: 'Test User',
            id: 'google-123',
          };
          return true;
        },
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

  describe('POST /auth/register', () => {
    it('retorna 201 com mensagem quando sem senha', async () => {
      registerUseCase.execute.mockResolvedValue({});
      await request(app.getHttpServer() as HttpServer)
        .post('/auth/register')
        .send({ email: 'test@test.com', name: 'Test' })
        .expect(201)
        .expect({ message: 'User registered successfully' });
    });

    it('retorna 201 com tokens quando com senha', async () => {
      registerUseCase.execute.mockResolvedValue({
        user: {},
        tokens: mockTokens,
      });
      await request(app.getHttpServer() as HttpServer)
        .post('/auth/register')
        .send({ email: 'test@test.com', name: 'Test', password: 'pass' })
        .expect(201)
        .expect(mockTokens);
    });
  });

  describe('POST /auth/login', () => {
    it('retorna 201 com tokens', async () => {
      loginUseCase.execute.mockResolvedValue(mockTokens);
      await request(app.getHttpServer() as HttpServer)
        .post('/auth/login')
        .send({ email: 'test@test.com', password: 'pass' })
        .expect(201)
        .expect(mockTokens);
    });
  });

  describe('POST /auth/refresh', () => {
    it('retorna 201 com novo access_token', async () => {
      refreshUseCase.execute.mockResolvedValue({ access_token: 'new-jwt' });
      await request(app.getHttpServer() as HttpServer)
        .post('/auth/refresh')
        .send({ refresh_token: 'rt' })
        .expect(201)
        .expect({ access_token: 'new-jwt' });
    });

    it('retorna 401 quando refresh_token não fornecido', async () => {
      await request(app.getHttpServer() as HttpServer)
        .post('/auth/refresh')
        .send({})
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('retorna 201 com mensagem de sucesso', async () => {
      logoutUseCase.execute.mockResolvedValue(undefined);
      await request(app.getHttpServer() as HttpServer)
        .post('/auth/logout')
        .send({ refresh_token: 'rt' })
        .expect(201)
        .expect({ message: 'Logged out successfully' });
    });
  });

  describe('GET /auth/me', () => {
    it('retorna 200 com dados do usuário', async () => {
      usersService.findById.mockResolvedValue(mockUser);
      establishmentsService.findByUserId.mockResolvedValue(null);
      await request(app.getHttpServer() as HttpServer)
        .get('/auth/me')
        .expect(200)
        .expect({ userId: 'user-1', name: 'Test', email: 'test@test.com' });
    });
  });

  describe('GET /auth/google', () => {
    it('retorna 200 para iniciar fluxo Google OAuth', async () => {
      await request(app.getHttpServer() as HttpServer)
        .get('/auth/google')
        .expect(200);
    });
  });

  describe('GET /auth/google/callback', () => {
    beforeEach(() => {
      const mockUser = {
        userId: 'user-1',
        name: 'Test User',
        email: 'test@test.com',
      };

      googleAuthUseCase.execute.mockResolvedValue(mockUser);
      loginWithTokenUseCase.execute.mockResolvedValue(mockTokens);
    });

    it('redireciona para frontend com tokens', async () => {
      const response = await request(app.getHttpServer() as HttpServer)
        .get('/auth/google/callback')
        .expect(302);

      expect(response.headers.location).toContain('auth/callback');
      expect(response.headers.location).toContain('access_token=jwt');
      expect(response.headers.location).toContain('refresh_token=rt');
    });
  });
});
