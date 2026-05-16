import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ClsService } from '../../shared/prisma/cls.service';
import { TransactionService } from '../../shared/prisma/transaction.service';
import { UsersModule } from '../users/users.module';
import { AddressesModule } from '../addresses/addresses.module';
import { EstablishmentsModule } from '../establishments/establishments.module';
import { ContactsModule } from '../contacts/contacts.module';
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

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    UsersModule,
    AddressesModule,
    EstablishmentsModule,
    ContactsModule,
  ],
  controllers: [AuthController],
  providers: [
    PrismaService,
    ClsService,
    TransactionService,
    SessionsService,
    LocalStrategy,
    JwtStrategy,
    ...(process.env.GOOGLE_CLIENT_ID ? [GoogleStrategy] : []),
    JwtAuthGuard,
    LocalAuthGuard,
    ValidateUserUseCase,
    RegisterUserUseCase,
    LoginUserUseCase,
    LoginWithTokenUseCase,
    RefreshAccessTokenUseCase,
    LogoutUserUseCase,
    GoogleAuthUseCase,
    MailService,
    RequestPasswordResetUseCase,
    ResetPasswordUseCase,
    { provide: AUTH_TOKEN_REPOSITORY, useClass: PrismaAuthTokenRepository },
    {
      provide: AUTH_PROVIDER_REPOSITORY,
      useClass: PrismaAuthProviderRepository,
    },
    {
      provide: PASSWORD_RESET_TOKEN_REPOSITORY,
      useClass: PrismaPasswordResetTokenRepository,
    },
  ],
  exports: [SessionsService, JwtAuthGuard],
})
export class SessionsModule {}
