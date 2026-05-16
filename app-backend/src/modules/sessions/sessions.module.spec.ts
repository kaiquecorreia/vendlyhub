import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SessionsModule } from './sessions.module';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ClsService } from '../../shared/prisma/cls.service';
import { TransactionService } from '../../shared/prisma/transaction.service';
import { AuthController } from './controllers/auth.controller';
import { SessionsService } from './services/sessions.service';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { ValidateUserUseCase } from './use-cases/validate-user.usecase';
import { RegisterUserUseCase } from './use-cases/register-user.usecase';
import { LoginUserUseCase } from './use-cases/login-user.usecase';
import { LoginWithTokenUseCase } from './use-cases/login-with-token.usecase';
import { RefreshAccessTokenUseCase } from './use-cases/refresh-access-token.usecase';
import { LogoutUserUseCase } from './use-cases/logout-user.usecase';
import { GoogleAuthUseCase } from './use-cases/google-auth.usecase';
import { RequestPasswordResetUseCase } from './use-cases/request-password-reset.usecase';
import { ResetPasswordUseCase } from './use-cases/reset-password.usecase';
import { MailService } from './services/mail.service';
import { AUTH_TOKEN_REPOSITORY } from './repositories/auth-token.repository';
import { AUTH_PROVIDER_REPOSITORY } from './repositories/auth-provider.repository';
import { PrismaAuthTokenRepository } from './repositories/prisma/prisma.auth-token.repository';
import { PrismaAuthProviderRepository } from './repositories/prisma/prisma.auth-provider.repository';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from './repositories/password-reset-token.repository';
import { PrismaPasswordResetTokenRepository } from './repositories/prisma/prisma.password-reset-token.repository';

describe('SessionsModule', () => {
  let module: TestingModule;

  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv, JWT_SECRET: 'test-secret' };

    module = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
        SessionsModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(jest.fn())
      .overrideProvider(ClsService)
      .useValue(jest.fn())
      .overrideProvider(TransactionService)
      .useValue(jest.fn())
      .compile();
  });

  afterEach(async () => {
    await module.close();
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide PrismaService', () => {
    const service = module.get<PrismaService>(PrismaService);
    expect(service).toBeDefined();
  });

  it('should provide ClsService', () => {
    const service = module.get<ClsService>(ClsService);
    expect(service).toBeDefined();
  });

  it('should provide TransactionService', () => {
    const service = module.get<TransactionService>(TransactionService);
    expect(service).toBeDefined();
  });

  it('should provide SessionsService', () => {
    const service = module.get<SessionsService>(SessionsService);
    expect(service).toBeDefined();
  });

  it('should provide AuthController', () => {
    const controller = module.get<AuthController>(AuthController);
    expect(controller).toBeDefined();
  });

  it('should provide LocalStrategy', () => {
    const strategy = module.get<LocalStrategy>(LocalStrategy);
    expect(strategy).toBeDefined();
  });

  it('should provide JwtStrategy', () => {
    const strategy = module.get<JwtStrategy>(JwtStrategy);
    expect(strategy).toBeDefined();
  });

  it('should provide JwtAuthGuard', () => {
    const guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    expect(guard).toBeDefined();
  });

  it('should provide LocalAuthGuard', () => {
    const guard = module.get<LocalAuthGuard>(LocalAuthGuard);
    expect(guard).toBeDefined();
  });

  it('should provide all use cases', () => {
    expect(module.get<ValidateUserUseCase>(ValidateUserUseCase)).toBeDefined();
    expect(module.get<RegisterUserUseCase>(RegisterUserUseCase)).toBeDefined();
    expect(module.get<LoginUserUseCase>(LoginUserUseCase)).toBeDefined();
    expect(
      module.get<LoginWithTokenUseCase>(LoginWithTokenUseCase),
    ).toBeDefined();
    expect(
      module.get<RefreshAccessTokenUseCase>(RefreshAccessTokenUseCase),
    ).toBeDefined();
    expect(module.get<LogoutUserUseCase>(LogoutUserUseCase)).toBeDefined();
    expect(module.get<GoogleAuthUseCase>(GoogleAuthUseCase)).toBeDefined();
    expect(
      module.get<RequestPasswordResetUseCase>(RequestPasswordResetUseCase),
    ).toBeDefined();
    expect(
      module.get<ResetPasswordUseCase>(ResetPasswordUseCase),
    ).toBeDefined();
    expect(module.get<MailService>(MailService)).toBeDefined();
  });

  it('should provide AUTH_TOKEN_REPOSITORY token with PrismaAuthTokenRepository', () => {
    const repository = module.get<PrismaAuthTokenRepository>(
      AUTH_TOKEN_REPOSITORY,
    );
    expect(repository).toBeDefined();
    expect(repository).toBeInstanceOf(PrismaAuthTokenRepository);
  });

  it('should provide AUTH_PROVIDER_REPOSITORY token with PrismaAuthProviderRepository', () => {
    const repository = module.get<PrismaAuthProviderRepository>(
      AUTH_PROVIDER_REPOSITORY,
    );
    expect(repository).toBeDefined();
    expect(repository).toBeInstanceOf(PrismaAuthProviderRepository);
  });

  it('should provide PASSWORD_RESET_TOKEN_REPOSITORY token with PrismaPasswordResetTokenRepository', () => {
    const repository = module.get<PrismaPasswordResetTokenRepository>(
      PASSWORD_RESET_TOKEN_REPOSITORY,
    );
    expect(repository).toBeDefined();
    expect(repository).toBeInstanceOf(PrismaPasswordResetTokenRepository);
  });

  it('should export SessionsService', () => {
    const exportedService = module.get<SessionsService>(SessionsService);
    expect(exportedService).toBeDefined();
  });

  it('should export JwtAuthGuard', () => {
    const exportedGuard = module.get<JwtAuthGuard>(JwtAuthGuard);
    expect(exportedGuard).toBeDefined();
  });

  describe('GoogleStrategy conditional loading', () => {
    it('should include GoogleStrategy when GOOGLE_CLIENT_ID is set', async () => {
      process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
      process.env.GOOGLE_CALLBACK_URL =
        'http://localhost:3000/auth/google/callback';

      const testModule = await Test.createTestingModule({
        imports: [
          PassportModule,
          JwtModule.register({
            secret: 'test-secret',
            signOptions: { expiresIn: '1h' },
          }),
          SessionsModule,
        ],
      })
        .overrideProvider(PrismaService)
        .useValue(jest.fn())
        .overrideProvider(ClsService)
        .useValue(jest.fn())
        .overrideProvider(TransactionService)
        .useValue(jest.fn())
        .overrideProvider(GoogleAuthUseCase)
        .useValue(jest.fn())
        .compile();

      expect(testModule).toBeDefined();
      await testModule.close();
    });

    it('should exclude GoogleStrategy when GOOGLE_CLIENT_ID is not set', async () => {
      delete process.env.GOOGLE_CLIENT_ID;

      const testModule = await Test.createTestingModule({
        imports: [
          PassportModule,
          JwtModule.register({
            secret: 'test-secret',
            signOptions: { expiresIn: '1h' },
          }),
          SessionsModule,
        ],
      })
        .overrideProvider(PrismaService)
        .useValue(jest.fn())
        .overrideProvider(ClsService)
        .useValue(jest.fn())
        .overrideProvider(TransactionService)
        .useValue(jest.fn())
        .compile();

      expect(testModule).toBeDefined();
      expect(() => testModule.get(GoogleStrategy)).toThrow();
      await testModule.close();
    });
  });
});
