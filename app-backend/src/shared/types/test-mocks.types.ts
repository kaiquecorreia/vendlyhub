import { Request, Response } from 'express';
import { User } from '../../modules/users/entities/user.entity';
import {
  CreateUserData,
  IUserRepository,
} from '../../modules/users/repositories/user.repository';
import { Address } from '../../modules/addresses/entities/address.entity';
import { Establishment } from '../../modules/establishments/entities/establishment.entity';
import { Contact } from '../../modules/contacts/entities/contact.entity';
import {
  IContactRepository,
  CreateContactData,
} from '../../modules/contacts/repositories/contact.repository';
import {
  IAuthTokenRepository,
  CreateAuthTokenData,
} from '../../modules/sessions/repositories/auth-token.repository';
import {
  IAuthProviderRepository,
  CreateAuthProviderData,
} from '../../modules/sessions/repositories/auth-provider.repository';
import { INestApplication } from '@nestjs/common';
import { AuthToken } from '../../modules/sessions/entities/auth-token.entity';
import { AuthProvider } from '../../modules/sessions/entities/auth-provider.entity';

export interface MockUserRepository extends jest.Mocked<IUserRepository> {
  findByEmail: jest.MockedFunction<(email: string) => Promise<User | null>>;
  findById: jest.MockedFunction<(userId: string) => Promise<User | null>>;
  create: jest.MockedFunction<(data: CreateUserData) => Promise<User>>;
  update: jest.MockedFunction<
    (
      userId: string,
      data: Partial<Pick<User, 'name' | 'isActive' | 'lastLoginAt'>>,
    ) => Promise<User>
  >;
}

export interface MockAddressRepository {
  create: jest.MockedFunction<(data: Partial<Address>) => Promise<Address>>;
  findByUserId: jest.MockedFunction<(userId: string) => Promise<Address[]>>;
  findById: jest.MockedFunction<(addressId: string) => Promise<Address | null>>;
}

export interface MockEstablishmentRepository {
  create: jest.MockedFunction<
    (data: Partial<Establishment>) => Promise<Establishment>
  >;
  findByUserId: jest.MockedFunction<
    (userId: string) => Promise<Establishment[]>
  >;
  linkUser: jest.MockedFunction<
    (establishmentId: string, userId: string) => Promise<void>
  >;
}

export interface MockContactRepository extends jest.Mocked<IContactRepository> {
  create: jest.MockedFunction<(data: CreateContactData) => Promise<Contact>>;
  findByOwnerId: jest.MockedFunction<
    (ownerId: string, ownerType: any) => Promise<Contact[]>
  >;
}

export interface MockAuthTokenRepository
  extends jest.Mocked<IAuthTokenRepository> {
  create: jest.MockedFunction<
    (data: CreateAuthTokenData) => Promise<AuthToken>
  >;
  findByRefreshTokenHash: jest.MockedFunction<
    (refreshTokenHash: string) => Promise<(AuthToken & { user: User }) | null>
  >;
  deleteByRefreshTokenHash: jest.MockedFunction<
    (refreshTokenHash: string) => Promise<void>
  >;
}

export interface MockAuthProviderRepository
  extends jest.Mocked<IAuthProviderRepository> {
  create: jest.MockedFunction<
    (data: CreateAuthProviderData) => Promise<AuthProvider>
  >;
  findByProviderAndProviderId: jest.MockedFunction<
    (provider: any, providerId: string) => Promise<AuthProvider | null>
  >;
  findByUserIdAndProvider: jest.MockedFunction<
    (userId: string, provider: any) => Promise<AuthProvider | null>
  >;
}

export interface MockUsersService {
  findByEmail: jest.MockedFunction<(email: string) => Promise<User | null>>;
  findById: jest.MockedFunction<(userId: string) => Promise<User>>;
  create: jest.MockedFunction<(data: CreateUserData) => Promise<User>>;
}

export interface MockAddressesService {
  create: jest.MockedFunction<(data: Partial<Address>) => Promise<Address>>;
  findByUserId: jest.MockedFunction<(userId: string) => Promise<Address[]>>;
}

export interface MockEstablishmentsService {
  create: jest.MockedFunction<
    (data: Partial<Establishment>) => Promise<Establishment>
  >;
  findByUserId: jest.MockedFunction<
    (userId: string) => Promise<Establishment[]>
  >;
  linkUser: jest.MockedFunction<
    (establishmentId: string, userId: string) => Promise<void>
  >;
}

export interface MockContactsService {
  create: jest.MockedFunction<(data: Partial<Contact>) => Promise<Contact>>;
  findByUserId: jest.MockedFunction<(userId: string) => Promise<Contact[]>>;
}

export interface MockTransactionService {
  run: jest.MockedFunction<(cb: () => Promise<void>) => Promise<void>>;
}

export interface MockExecutionContext {
  switchToHttp: jest.MockedFunction<
    () => {
      getRequest: jest.MockedFunction<() => Request & { user?: any }>;
    }
  >;
}

export interface MockPrismaService {
  getClient: jest.MockedFunction<() => unknown>;
}

export interface MockSessionsService {
  findTokenByHash: jest.MockedFunction<
    (hash: string) => Promise<AuthToken | null>
  >;
  createToken: jest.MockedFunction<
    (data: CreateAuthTokenData) => Promise<AuthToken>
  >;
}

export interface MockJwtService {
  sign: jest.MockedFunction<
    (payload: { sub: string; email: string }) => string
  >;
  verify: jest.MockedFunction<
    (token: string) => { sub: string; email: string }
  >;
}

export interface MockValidateUserUseCase {
  execute: jest.MockedFunction<
    (email: string, password: string) => Promise<User | null>
  >;
}

export interface MockLoginWithTokenUseCase {
  execute: jest.MockedFunction<
    (token: string) => Promise<{ access_token: string; refresh_token: string }>
  >;
}

export interface MockGoogleAuthUseCase {
  execute: jest.MockedFunction<
    (token: string) => Promise<{ access_token: string; refresh_token: string }>
  >;
}

export interface MockApp extends INestApplication {
  getHttpServer: jest.MockedFunction<() => unknown>;
}

export type MockRequest = Request & { user?: { userId: string } };

export type MockResponse = Response<any, Record<string, any>>;

export interface MockUser {
  email: string;
  name: string;
  id: string;
}

export interface MockRegisterData {
  email: string;
  password: string;
  name: string;
}
