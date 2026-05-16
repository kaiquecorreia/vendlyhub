import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RegisterUserUseCase } from './register-user.usecase';
import { DocumentType, AuthProviderType } from '@prisma/client';
import {
  MockUsersService,
  MockAddressesService,
  MockEstablishmentsService,
  MockContactsService,
  MockTransactionService,
} from '../../../shared/types/test-mocks.types';

const makeDto = (overrides: Record<string, unknown> = {}) => ({
  email: 'test@test.com',
  password: 'pass123',
  name: 'Test User',
  ...overrides,
});

const makeDtoWithEstablishment = (overrides: Record<string, unknown> = {}) => ({
  email: 'test@test.com',
  password: 'pass123',
  name: 'Test User',
  establishmentName: 'My Restaurant',
  document: '12345678000199',
  documentType: DocumentType.cnpj,
  establishmentTypes: ['Restaurantes'],
  cep: '01310-100',
  street: 'Av Paulista',
  number: '1000',
  complement: undefined,
  neighborhood: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP',
  ...overrides,
});

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let usersService: MockUsersService;
  let addressesService: MockAddressesService;
  let establishmentsService: MockEstablishmentsService;
  let contactsService: MockContactsService;
  let transactionService: MockTransactionService;
  let sessionsService: { createProvider: jest.Mock };
  let loginWithTokenUseCase: { execute: jest.Mock };

  const tokenPair = () => ({
    access_token: 'access',
    refresh_token: 'refresh',
  });

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
    };
    addressesService = { create: jest.fn(), findByUserId: jest.fn() };
    establishmentsService = {
      create: jest.fn(),
      linkUser: jest.fn(),
      findByUserId: jest.fn(),
    };
    contactsService = { create: jest.fn(), findByUserId: jest.fn() };
    transactionService = {
      run: jest.fn().mockImplementation((cb: () => Promise<void>) => cb()),
    };
    sessionsService = {
      createProvider: jest.fn(),
    };
    loginWithTokenUseCase = {
      execute: jest.fn().mockResolvedValue(tokenPair()),
    };
    useCase = new RegisterUserUseCase(
      usersService as any,
      addressesService as any,
      establishmentsService as any,
      contactsService as any,
      transactionService as any,
      sessionsService as any,
      loginWithTokenUseCase as any,
    );
  });

  it('cria usuário sem establishment e retorna User', async () => {
    const user = {
      userId: 'user-1',
      email: 'test@test.com',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue(user);
    sessionsService.createProvider.mockResolvedValue({
      authProviderId: 'provider-1',
      userId: user.userId,
      provider: AuthProviderType.email,
      providerId: user.email,
      createdAt: new Date(),
    });
    const result = await useCase.execute(makeDto());
    expect(transactionService.run).toHaveBeenCalled();
    expect(usersService.create).toHaveBeenCalled();
    expect(sessionsService.createProvider).toHaveBeenCalledWith({
      userId: 'user-1',
      provider: AuthProviderType.email,
      providerId: 'test@test.com',
    });
    expect(loginWithTokenUseCase.execute).toHaveBeenCalledWith(user);
    expect(result).toEqual({ user, tokens: tokenPair() });
  });

  it('lança ConflictException quando email já existe', async () => {
    usersService.findByEmail.mockResolvedValue({
      userId: 'existing',
      email: 'existing@test.com',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await expect(useCase.execute(makeDto())).rejects.toThrow(ConflictException);
  });

  it('cria usuário, establishment, address e linka usuário em transação', async () => {
    const user = {
      userId: 'user-1',
      email: 'test@test.com',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const address = {
      addressId: 'addr-1',
      cep: '01310-100',
      street: 'Av Paulista',
      number: '1000',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
    };
    const establishment = {
      establishmentId: 'est-1',
      name: 'My Restaurant',
      document: '12345678000199',
      documentType: 'cnpj',
      establishmentTypes: ['Restaurantes'],
      addressId: 'addr-1',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue(user);
    sessionsService.createProvider.mockResolvedValue({
      authProviderId: 'provider-1',
      userId: user.userId,
      provider: AuthProviderType.email,
      providerId: user.email,
      createdAt: new Date(),
    });
    addressesService.create.mockResolvedValue(address);
    establishmentsService.create.mockResolvedValue(establishment);
    establishmentsService.linkUser.mockResolvedValue(undefined);
    const result = await useCase.execute(makeDtoWithEstablishment());
    expect(transactionService.run).toHaveBeenCalled();
    expect(addressesService.create).toHaveBeenCalled();
    expect(establishmentsService.create).toHaveBeenCalled();
    expect(establishmentsService.linkUser).toHaveBeenCalledWith(
      'user-1',
      'est-1',
      'owner',
    );
    expect(loginWithTokenUseCase.execute).toHaveBeenCalledWith(user);
    expect(result).toEqual({ user, tokens: tokenPair() });
  });

  it('cria establishment com phone_number e cria contato', async () => {
    const user = {
      userId: 'user-1',
      email: 'test@test.com',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const address = {
      addressId: 'addr-1',
      cep: '01310-100',
      street: 'Av Paulista',
      number: '1000',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
    };
    const establishment = {
      establishmentId: 'est-1',
      name: 'My Restaurant',
      document: '12345678000199',
      documentType: 'cnpj',
      establishmentTypes: ['Restaurantes'],
      addressId: 'addr-1',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const contact = {
      contactId: 'contact-1',
      ownerType: 'establishment',
      ownerId: 'est-1',
      contactType: 'phone_number',
      value: '11999999999',
      establishmentId: 'est-1',
      isPrimary: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue(user);
    addressesService.create.mockResolvedValue(address);
    establishmentsService.create.mockResolvedValue(establishment);
    establishmentsService.linkUser.mockResolvedValue(undefined);
    contactsService.create.mockResolvedValue(contact);

    const dto = makeDtoWithEstablishment({ phone_number: '11999999999' });
    const result = await useCase.execute(dto);

    expect(contactsService.create).toHaveBeenCalledWith({
      ownerType: 'establishment',
      ownerId: 'est-1',
      contactType: 'phone_number',
      value: '11999999999',
      establishmentId: 'est-1',
    });
    expect(result).toEqual({ user, tokens: tokenPair() });
  });

  it('cria establishment com mobile_number e cria contato', async () => {
    const user = {
      userId: 'user-1',
      email: 'test@test.com',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const address = {
      addressId: 'addr-1',
      cep: '01310-100',
      street: 'Av Paulista',
      number: '1000',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
    };
    const establishment = {
      establishmentId: 'est-1',
      name: 'My Restaurant',
      document: '12345678000199',
      documentType: 'cnpj',
      establishmentTypes: ['Restaurantes'],
      addressId: 'addr-1',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const contact = {
      contactId: 'contact-1',
      ownerType: 'establishment',
      ownerId: 'est-1',
      contactType: 'mobile_number',
      value: '11999999999',
      establishmentId: 'est-1',
      isPrimary: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue(user);
    addressesService.create.mockResolvedValue(address);
    establishmentsService.create.mockResolvedValue(establishment);
    establishmentsService.linkUser.mockResolvedValue(undefined);
    contactsService.create.mockResolvedValue(contact);

    const dto = makeDtoWithEstablishment({ mobile_number: '11988888888' });
    const result = await useCase.execute(dto);

    expect(contactsService.create).toHaveBeenCalledWith({
      ownerType: 'establishment',
      ownerId: 'est-1',
      contactType: 'mobile_number',
      value: '11988888888',
      establishmentId: 'est-1',
    });
    expect(result).toEqual({ user, tokens: tokenPair() });
  });

  it('cria establishment com phone_number e mobile_number e cria ambos contatos', async () => {
    const user = {
      userId: 'user-1',
      email: 'test@test.com',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const address = {
      addressId: 'addr-1',
      cep: '01310-100',
      street: 'Av Paulista',
      number: '1000',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
    };
    const establishment = {
      establishmentId: 'est-1',
      name: 'My Restaurant',
      document: '12345678000199',
      documentType: 'cnpj',
      establishmentTypes: ['Restaurantes'],
      addressId: 'addr-1',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const contact = {
      contactId: 'contact-1',
      ownerType: 'establishment',
      ownerId: 'est-1',
      contactType: 'phone_number',
      value: '11999999999',
      establishmentId: 'est-1',
      isPrimary: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue(user);
    addressesService.create.mockResolvedValue(address);
    establishmentsService.create.mockResolvedValue(establishment);
    establishmentsService.linkUser.mockResolvedValue(undefined);
    contactsService.create.mockResolvedValue(contact);

    const dto = makeDtoWithEstablishment({
      phone_number: '11999999999',
      mobile_number: '11988888888',
    });
    const result = await useCase.execute(dto);

    expect(contactsService.create).toHaveBeenCalledTimes(2);
    expect(contactsService.create).toHaveBeenNthCalledWith(1, {
      ownerType: 'establishment',
      ownerId: 'est-1',
      contactType: 'phone_number',
      value: '11999999999',
      establishmentId: 'est-1',
    });
    expect(contactsService.create).toHaveBeenNthCalledWith(2, {
      ownerType: 'establishment',
      ownerId: 'est-1',
      contactType: 'mobile_number',
      value: '11988888888',
      establishmentId: 'est-1',
    });
    expect(result).toEqual({ user, tokens: tokenPair() });
  });

  it('cria usuário sem senha', async () => {
    const user = {
      userId: 'user-1',
      email: 'test@test.com',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue(user);
    const result = await useCase.execute(makeDto({ password: undefined }));
    expect(usersService.create).toHaveBeenCalledWith({
      email: 'test@test.com',
      passwordHash: expect.any(String),
      name: 'Test User',
    });
    expect(loginWithTokenUseCase.execute).not.toHaveBeenCalled();
    expect(result).toEqual({ user, tokens: undefined });
  });

  it('lança ConflictException quando Prisma retorna P2002 no create do usuário', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    const p2002 = new Prisma.PrismaClientKnownRequestError('Unique', {
      code: 'P2002',
      clientVersion: 'test',
    });
    usersService.create.mockRejectedValue(p2002);
    await expect(useCase.execute(makeDto())).rejects.toThrow(ConflictException);
  });
});
