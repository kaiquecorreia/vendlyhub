import { ExecutionContext } from '@nestjs/common';

// Tipos base para entidades do domínio
export interface MockTokens {
  access_token: string;
  refresh_token: string;
}

export interface MockUser {
  userId: string;
  name?: string | null;
  avatar?: string | null;
  email: string;
  isActive: boolean;
  lastLoginAt?: Date | null;
  passwordHash?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockEstablishment {
  establishmentId: string;
  name: string;
  userId: string;
}

export interface MockContact {
  contactId: string;
  ownerId: string;
  ownerType: string;
  contactType: string;
  value: string;
  label?: string | null;
  isPrimary: boolean;
}

export interface MockAddress {
  addressId: string;
  cep?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
}

// Mock types for use cases
export interface MockUseCase<TArgs extends readonly unknown[], TReturn> {
  execute: jest.MockedFunction<(...args: TArgs) => TReturn>;
}

export type MockRegisterUserUseCase = MockUseCase<
  [CreateUserData],
  Promise<void>
>;

export type MockLoginUserUseCase = MockUseCase<
  [string, string],
  Promise<MockTokens>
>;

export type MockRefreshAccessTokenUseCase = MockUseCase<
  [string],
  Promise<MockTokens>
>;

export type MockLogoutUserUseCase = MockUseCase<[string], Promise<void>>;

export type MockGoogleAuthUseCase = MockUseCase<
  [string, string, string],
  Promise<MockUser>
>;

export type MockLoginWithTokenUseCase = MockUseCase<
  [MockUser],
  Promise<MockTokens>
>;

// Mock types for services
export interface MockUsersService {
  findById: jest.MockedFunction<(id: string) => Promise<MockUser | null>>;
  create: jest.MockedFunction<(data: CreateUserData) => Promise<MockUser>>;
  update: jest.MockedFunction<
    (id: string, data: Partial<MockUser>) => Promise<MockUser>
  >;
  delete: jest.MockedFunction<(id: string) => Promise<void>>;
  findByEmail: jest.MockedFunction<(email: string) => Promise<MockUser | null>>;
}

export interface MockAddressesService {
  findById: jest.MockedFunction<(id: string) => Promise<MockAddress | null>>;
  create: jest.MockedFunction<
    (data: Partial<MockAddress>) => Promise<MockAddress>
  >;
  update: jest.MockedFunction<
    (id: string, data: Partial<MockAddress>) => Promise<MockAddress>
  >;
  delete: jest.MockedFunction<(id: string) => Promise<void>>;
}

export interface MockContactsService {
  findByOwnerId: jest.MockedFunction<
    (ownerId: string) => Promise<MockContact[]>
  >;
  create: jest.MockedFunction<
    (data: Partial<MockContact>) => Promise<MockContact>
  >;
  update: jest.MockedFunction<
    (id: string, data: Partial<MockContact>) => Promise<MockContact>
  >;
  delete: jest.MockedFunction<(id: string) => Promise<void>>;
}

export interface MockEstablishmentsService {
  findByUserId: jest.MockedFunction<
    (userId: string) => Promise<MockEstablishment | null>
  >;
  create: jest.MockedFunction<
    (data: Partial<MockEstablishment>) => Promise<MockEstablishment>
  >;
  update: jest.MockedFunction<
    (id: string, data: Partial<MockEstablishment>) => Promise<MockEstablishment>
  >;
  delete: jest.MockedFunction<(id: string) => Promise<void>>;
}

// Mock types for repositories
export interface MockRepository<T, CreateData = Partial<T>> {
  create: jest.MockedFunction<(data: CreateData) => Promise<T>>;
  findById: jest.MockedFunction<(id: string) => Promise<T | null>>;
  update: jest.MockedFunction<(id: string, data: Partial<T>) => Promise<T>>;
  delete: jest.MockedFunction<(id: string) => Promise<void>>;
  findMany: jest.MockedFunction<(filter?: unknown) => Promise<T[]>>;
}

// Specific repository mock types
export interface MockUserRepository
  extends MockRepository<MockUser, CreateUserData> {
  findByEmail: jest.MockedFunction<(email: string) => Promise<MockUser | null>>;
}

export interface MockEstablishmentRepository
  extends MockRepository<MockEstablishment> {
  findByUserId: jest.MockedFunction<
    (userId: string) => Promise<MockEstablishment[]>
  >;
}

export interface MockContactRepository extends MockRepository<MockContact> {
  findByOwnerId: jest.MockedFunction<
    (ownerId: string, ownerType: string) => Promise<MockContact[]>
  >;
}

export interface MockAddressRepository extends MockRepository<MockAddress> {
  findByContactId: jest.MockedFunction<
    (contactId: string) => Promise<MockAddress[]>
  >;
}

// Create user data interface
export interface CreateUserData {
  email: string;
  passwordHash?: string | null;
  name?: string;
}

// Mock types for guards
export interface MockGuard {
  canActivate: jest.MockedFunction<
    (context: ExecutionContext) => boolean | Promise<boolean>
  >;
}

// Mock types for Prisma
export interface MockPrismaTransactionClient {
  $transaction: jest.MockedFunction<
    <T>(fn: (tx: MockPrismaTransactionClient) => Promise<T>) => Promise<T>
  >;
  user: Record<string, unknown>;
  establishment: Record<string, unknown>;
  contact: Record<string, unknown>;
  address: Record<string, unknown>;
  authToken: Record<string, unknown>;
  authProvider: Record<string, unknown>;
  userEstablishment: Record<string, unknown>;
}

export interface MockPrismaService {
  getClient: jest.MockedFunction<
    () => MockPrismaClient | MockPrismaTransactionClient
  >;
  runInTransaction: jest.MockedFunction<
    <T>(fn: () => Promise<T>) => Promise<T>
  >;
  onModuleDestroy: jest.MockedFunction<() => Promise<void>>;
  prisma: Partial<MockPrismaClient>;
  pool: { end: jest.MockedFunction<() => Promise<void>> };
  clsService: {
    prismaTransaction: {
      run: jest.MockedFunction<(store: unknown, callback: () => void) => void>;
      getStore: jest.MockedFunction<() => unknown>;
    };
  };
  logger: {
    log: jest.MockedFunction<(message: string) => void>;
  };
}

// Mock Prisma Client for testing
export interface MockPrismaClient {
  $disconnect: jest.MockedFunction<() => Promise<void>>;
  $transaction: jest.MockedFunction<
    <T>(fn: (tx: MockPrismaTransactionClient) => Promise<T>) => Promise<T>
  >;
  user: Record<string, unknown>;
  establishment: Record<string, unknown>;
  contact: Record<string, unknown>;
  address: Record<string, unknown>;
  authToken: Record<string, unknown>;
  authProvider: Record<string, unknown>;
  userEstablishment: Record<string, unknown>;
}

// Mock types for Express
export interface MockRequest {
  user?: unknown;
  body?: unknown;
  params?: Record<string, string>;
  query?: Record<string, string>;
  headers?: Record<string, string>;
}

export interface MockResponse {
  redirect: jest.MockedFunction<(url: string) => MockResponse>;
  status: jest.MockedFunction<(code: number) => MockResponse>;
  json: jest.MockedFunction<(data: unknown) => MockResponse>;
  send: jest.MockedFunction<(data: unknown) => MockResponse>;
}

// Factory functions for creating mocks
export const createMockUser = (
  overrides: Partial<MockUser> = {},
): MockUser => ({
  userId: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  isActive: true,
  lastLoginAt: null,
  passwordHash: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockTokens = (
  overrides: Partial<MockTokens> = {},
): MockTokens => ({
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  ...overrides,
});

export const createMockEstablishment = (
  overrides: Partial<MockEstablishment> = {},
): MockEstablishment => ({
  establishmentId: 'establishment-1',
  name: 'Test Establishment',
  userId: 'user-1',
  ...overrides,
});

export const createMockContact = (
  overrides: Partial<MockContact> = {},
): MockContact => ({
  contactId: 'contact-1',
  ownerId: 'user-1',
  ownerType: 'USER',
  contactType: 'EMAIL',
  value: 'test@example.com',
  label: null,
  isPrimary: true,
  ...overrides,
});

export const createMockAddress = (
  overrides: Partial<MockAddress> = {},
): MockAddress => ({
  addressId: 'address-1',
  cep: '12345-678',
  street: 'Test Street',
  number: '123',
  complement: null,
  neighborhood: 'Test Neighborhood',
  city: 'Test City',
  state: 'TS',
  ...overrides,
});

// Mock file for multer
export const createMockFile = (
  filename = 'test.jpg',
  mimetype = 'image/jpeg',
): Express.Multer.File => {
  return {
    fieldname: 'logo',
    originalname: filename,
    encoding: '7bit',
    mimetype,
    size: 1024,
    destination: './uploads/logos',
    filename: `123456789-${filename}`,
    path: `./uploads/logos/123456789-${filename}`,
    buffer: Buffer.from('test'),
  } as Express.Multer.File;
};

// Type guards for test utilities
export const isMockUser = (obj: unknown): obj is MockUser => {
  return Boolean(
    obj && typeof obj === 'object' && 'userId' in obj && 'email' in obj,
  );
};

export const isMockTokens = (obj: unknown): obj is MockTokens => {
  return Boolean(
    obj &&
      typeof obj === 'object' &&
      'access_token' in obj &&
      'refresh_token' in obj,
  );
};

// Mock factory functions for repositories
export const createMockUserRepository = (
  overrides: Partial<MockUserRepository> = {},
): MockUserRepository => ({
  create: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findMany: jest.fn(),
  findByEmail: jest.fn(),
  ...overrides,
});

export const createMockEstablishmentRepository = (
  overrides: Partial<MockEstablishmentRepository> = {},
): MockEstablishmentRepository => ({
  create: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findMany: jest.fn(),
  findByUserId: jest.fn(),
  ...overrides,
});

export const createMockContactRepository = (
  overrides: Partial<MockContactRepository> = {},
): MockContactRepository => ({
  create: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findMany: jest.fn(),
  findByOwnerId: jest.fn(),
  ...overrides,
});

export const createMockAddressRepository = (
  overrides: Partial<MockAddressRepository> = {},
): MockAddressRepository => ({
  create: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findMany: jest.fn(),
  findByContactId: jest.fn(),
  ...overrides,
});

// Mock factory for Prisma Service
export const createMockPrismaService = (
  overrides: Partial<MockPrismaService> = {},
): MockPrismaService => ({
  getClient: jest.fn(),
  runInTransaction: jest.fn(),
  onModuleDestroy: jest.fn(),
  prisma: {},
  pool: { end: jest.fn() },
  clsService: {
    prismaTransaction: {
      run: jest.fn(),
      getStore: jest.fn(),
    },
  },
  logger: {
    log: jest.fn(),
  },
  ...overrides,
});

// Mock factory for Prisma Client
export const createMockPrismaClient = (
  overrides: Partial<MockPrismaClient> = {},
): MockPrismaClient => ({
  $disconnect: jest.fn().mockResolvedValue(undefined),
  $transaction: jest.fn(),
  user: {},
  establishment: {},
  contact: {},
  address: {},
  authToken: {},
  authProvider: {},
  userEstablishment: {},
  ...overrides,
});

// Mock factory for transaction client
export const createMockTransactionClient = (
  overrides: Partial<MockPrismaTransactionClient> = {},
): MockPrismaTransactionClient => ({
  $transaction: jest.fn(),
  user: {},
  establishment: {},
  contact: {},
  address: {},
  authToken: {},
  authProvider: {},
  userEstablishment: {},
  ...overrides,
});
