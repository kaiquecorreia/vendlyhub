import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { Response } from 'express';
import { RegisterDto } from '../dto/register.dto';

const makeTokens = () => ({ access_token: 'jwt', refresh_token: 'rt' });
const makeUser = () => ({
  userId: 'user-1',
  name: 'Test',
  email: 'test@test.com',
  avatar: '/uploads/avatars/existing.jpg',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});
const makeMockFile = (filename = 'test.jpg', mimetype = 'image/jpeg') =>
  ({
    fieldname: 'logo',
    originalname: filename,
    encoding: '7bit',
    mimetype,
    size: 1024,
    destination: './uploads/logos',
    filename: `123456789-${filename}`,
    path: `./uploads/logos/123456789-${filename}`,
    buffer: Buffer.from('test'),
  }) as Express.Multer.File;

const makeAvatarMockFile = (filename = 'avatar.png', mimetype = 'image/png') =>
  ({
    fieldname: 'avatar',
    originalname: filename,
    encoding: '7bit',
    mimetype,
    size: 1024,
    destination: './uploads/avatars',
    filename: `123456789-${filename}`,
    path: `./uploads/avatars/123456789-${filename}`,
    buffer: Buffer.from('test'),
  }) as Express.Multer.File;

describe('AuthController', () => {
  let controller: AuthController;
  let registerUserUseCase: { execute: jest.Mock };
  let loginUserUseCase: { execute: jest.Mock };
  let refreshAccessTokenUseCase: { execute: jest.Mock };
  let logoutUserUseCase: { execute: jest.Mock };
  let googleAuthUseCase: { execute: jest.Mock };
  let loginWithTokenUseCase: { execute: jest.Mock };
  let requestPasswordResetUseCase: { execute: jest.Mock };
  let resetPasswordUseCase: { execute: jest.Mock };
  let usersService: { findById: jest.Mock; updateProfile: jest.Mock };
  let establishmentsService: { findByUserId: jest.Mock; update: jest.Mock };
  let addressesService: { findById: jest.Mock; update: jest.Mock };
  let contactsService: {
    findByOwnerId: jest.Mock;
    upsertEstablishmentContacts: jest.Mock;
  };
  let transactionService: { run: jest.Mock };

  beforeEach(() => {
    registerUserUseCase = { execute: jest.fn() };
    loginUserUseCase = { execute: jest.fn() };
    refreshAccessTokenUseCase = { execute: jest.fn() };
    logoutUserUseCase = { execute: jest.fn() };
    googleAuthUseCase = { execute: jest.fn() };
    loginWithTokenUseCase = { execute: jest.fn() };
    requestPasswordResetUseCase = { execute: jest.fn() };
    resetPasswordUseCase = { execute: jest.fn() };
    usersService = { findById: jest.fn(), updateProfile: jest.fn() };
    establishmentsService = { findByUserId: jest.fn(), update: jest.fn() };
    addressesService = { findById: jest.fn(), update: jest.fn() };
    contactsService = {
      findByOwnerId: jest.fn(),
      upsertEstablishmentContacts: jest.fn(),
    };
    transactionService = {
      run: jest.fn(async (fn: () => Promise<unknown>) => fn()),
    };

    // Using type assertions is necessary for mocking dependencies in unit tests
    // This follows NestJS testing best practices
    controller = new AuthController(
      registerUserUseCase as any,
      loginUserUseCase as any,
      refreshAccessTokenUseCase as any,
      logoutUserUseCase as any,
      googleAuthUseCase as any,
      loginWithTokenUseCase as any,
      requestPasswordResetUseCase as any,
      resetPasswordUseCase as any,
      usersService as any,
      establishmentsService as any,
      addressesService as any,
      contactsService as any,
      transactionService as any,
    );
  });

  describe('register()', () => {
    it('retorna mensagem de sucesso quando dto não tem senha', async () => {
      registerUserUseCase.execute.mockResolvedValue({
        user: makeUser(),
        tokens: undefined,
      });
      const dto: RegisterDto = { email: 'test@test.com', name: 'Test' };
      const result = await controller.register(dto);
      expect(registerUserUseCase.execute).toHaveBeenCalledWith(dto);
      expect(loginUserUseCase.execute).not.toHaveBeenCalled();
      expect(result).toEqual({ message: 'User registered successfully' });
    });

    it('retorna tokens quando dto tem senha', async () => {
      const tokens = makeTokens();
      registerUserUseCase.execute.mockResolvedValue({
        user: makeUser(),
        tokens,
      });
      const dto: RegisterDto = {
        email: 'test@test.com',
        password: 'pass',
        name: 'Test',
      };
      const result = await controller.register(dto);

      expect(loginUserUseCase.execute).not.toHaveBeenCalled();
      expect(result).toBe(tokens);
    });

    it('processa arquivo de logo quando fornecido', async () => {
      registerUserUseCase.execute.mockResolvedValue({
        user: makeUser(),
        tokens: undefined,
      });
      const file = makeMockFile('logo.png', 'image/png');
      const dto: RegisterDto = { email: 'test@test.com', name: 'Test' };

      await controller.register(dto, file);

      expect(dto.logo).toBe(`/uploads/logos/${file.filename}`);
      expect(registerUserUseCase.execute).toHaveBeenCalledWith(dto);
    });

    it('retorna tokens quando dto tem senha e arquivo fornecido', async () => {
      const tokens = makeTokens();
      registerUserUseCase.execute.mockResolvedValue({
        user: makeUser(),
        tokens,
      });
      const file = makeMockFile();
      const dto: RegisterDto = {
        email: 'test@test.com',
        password: 'pass',
        name: 'Test',
      };

      const result = await controller.register(dto, file);

      expect(dto.logo).toBe(`/uploads/logos/${file.filename}`);

      expect(loginUserUseCase.execute).not.toHaveBeenCalled();
      expect(result).toBe(tokens);
    });

    it('não modifica logo quando arquivo não fornecido', async () => {
      registerUserUseCase.execute.mockResolvedValue({
        user: makeUser(),
        tokens: undefined,
      });
      const dto: RegisterDto = {
        email: 'test@test.com',
        name: 'Test',
        logo: 'existing-logo.png',
      };

      await controller.register(dto);

      expect(dto.logo).toBe('existing-logo.png');
      expect(registerUserUseCase.execute).toHaveBeenCalledWith(dto);
    });
  });

  describe('login()', () => {
    it('delega ao loginUserUseCase e retorna tokens', async () => {
      const tokens = makeTokens();
      loginUserUseCase.execute.mockResolvedValue(tokens);
      const result = await controller.login({
        email: 'test@test.com',
        password: 'pass',
      });
      expect(result).toBe(tokens);
    });
  });

  describe('forgotPassword()', () => {
    it('delega ao requestPasswordResetUseCase', async () => {
      requestPasswordResetUseCase.execute.mockResolvedValue({ message: 'ok' });
      const result = await controller.forgotPassword({
        email: 'test@test.com',
      });
      expect(requestPasswordResetUseCase.execute).toHaveBeenCalledWith(
        'test@test.com',
      );
      expect(result).toEqual({ message: 'ok' });
    });
  });

  describe('resetPassword()', () => {
    it('delega ao resetPasswordUseCase', async () => {
      resetPasswordUseCase.execute.mockResolvedValue({ message: 'ok' });
      const result = await controller.resetPassword({
        token: 't',
        password: 'newpass123',
      });
      expect(resetPasswordUseCase.execute).toHaveBeenCalledWith(
        't',
        'newpass123',
      );
      expect(result).toEqual({ message: 'ok' });
    });
  });

  describe('refreshToken()', () => {
    it('retorna novo access_token', async () => {
      refreshAccessTokenUseCase.execute.mockResolvedValue({
        access_token: 'new-jwt',
      });
      const result = await controller.refreshToken('rt');
      expect(result).toEqual({ access_token: 'new-jwt' });
    });

    it('lança UnauthorizedException quando refresh_token não fornecido', async () => {
      await expect(
        controller.refreshToken(undefined as unknown as string),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('propaga erro quando use case falha', async () => {
      refreshAccessTokenUseCase.execute.mockRejectedValue(
        new Error('Invalid token'),
      );
      await expect(controller.refreshToken('invalid-token')).rejects.toThrow(
        'Invalid token',
      );
    });
  });

  describe('logout()', () => {
    it('chama logoutUserUseCase e retorna mensagem', async () => {
      logoutUserUseCase.execute.mockResolvedValue(undefined);
      const result = await controller.logout('rt');
      expect(logoutUserUseCase.execute).toHaveBeenCalledWith('rt');
      expect(result).toEqual({ message: 'Logged out successfully' });
    });

    it('lança UnauthorizedException quando refresh_token não fornecido', async () => {
      await expect(
        controller.logout(undefined as unknown as string),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('propaga erro quando use case falha', async () => {
      logoutUserUseCase.execute.mockRejectedValue(new Error('Token not found'));
      await expect(controller.logout('invalid-token')).rejects.toThrow(
        'Token not found',
      );
    });
  });

  describe('getMe()', () => {
    it('retorna dados do usuário e establishment', async () => {
      const user = makeUser();
      const establishment = {
        establishmentId: 'est-1',
        name: 'Restaurant',
        document: '123456789',
        documentType: 'cnpj',
        establishmentTypes: ['Restaurantes'],
        addressId: 'addr-1',
        logo: null,
        isActive: true,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const address = {
        addressId: 'addr-1',
        cep: '01310-100',
        street: 'Av. Paulista',
        number: '1000',
        complement: null,
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
      };
      usersService.findById.mockResolvedValue(user);
      establishmentsService.findByUserId.mockResolvedValue(establishment);
      addressesService.findById.mockResolvedValue(address);
      contactsService.findByOwnerId.mockResolvedValue([
        {
          contactId: 'c1',
          contactType: 'phone_number',
          value: '(11) 3333-4444',
        },
        {
          contactId: 'c2',
          contactType: 'mobile_number',
          value: '(11) 98888-7777',
        },
      ] as any);
      const req = { user: { userId: 'user-1' } };
      const result = await controller.getMe(req);
      expect(result).toEqual({
        userId: user.userId,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        establishment: {
          establishmentId: establishment.establishmentId,
          name: establishment.name,
          document: establishment.document,
          documentType: establishment.documentType,
          establishmentTypes: establishment.establishmentTypes,
          logo: undefined,
          address: {
            addressId: address.addressId,
            cep: address.cep ?? undefined,
            street: address.street ?? undefined,
            number: address.number ?? undefined,
            complement: address.complement ?? undefined,
            neighborhood: address.neighborhood ?? undefined,
            city: address.city ?? undefined,
            state: address.state ?? undefined,
          },
          phone_number: '(11) 3333-4444',
          mobile_number: '(11) 98888-7777',
        },
      });
    });

    it('retorna establishment como undefined quando não encontrado', async () => {
      const user = makeUser();
      usersService.findById.mockResolvedValue(user);
      establishmentsService.findByUserId.mockResolvedValue(null);
      const req = { user: { userId: 'user-1' } };
      const result = await controller.getMe(req);
      expect(result.establishment).toBeUndefined();
    });

    it('lança UnauthorizedException quando usuário não encontrado', async () => {
      usersService.findById.mockResolvedValue(null);
      const req = { user: { userId: 'invalid-user' } };

      await expect(controller.getMe(req)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('patchMe()', () => {
    it('retorna dados do usuário e establishment após atualização', async () => {
      const user = makeUser();
      const establishment = {
        establishmentId: 'est-1',
        name: 'Restaurant',
        document: '123456789',
        documentType: 'cnpj',
        establishmentTypes: ['Restaurantes'],
        addressId: 'addr-1',
        logo: null,
        isActive: true,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const address = {
        addressId: 'addr-1',
        cep: '01310-100',
        street: 'Av. Paulista',
        number: '1000',
        complement: null,
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
      };
      usersService.updateProfile.mockResolvedValue(user);
      establishmentsService.findByUserId.mockResolvedValue(establishment);
      addressesService.findById.mockResolvedValue(address);
      contactsService.findByOwnerId.mockResolvedValue([] as any);
      const req = { user: { userId: 'user-1' } };
      const dto = { name: 'Updated Name' };
      const result = await controller.patchMe(req, dto);
      expect(usersService.updateProfile).toHaveBeenCalledWith('user-1', dto);
      expect(result).toEqual({
        userId: user.userId,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        establishment: {
          establishmentId: establishment.establishmentId,
          name: establishment.name,
          document: establishment.document,
          documentType: establishment.documentType,
          establishmentTypes: establishment.establishmentTypes,
          logo: undefined,
          address: {
            addressId: address.addressId,
            cep: address.cep ?? undefined,
            street: address.street ?? undefined,
            number: address.number ?? undefined,
            complement: address.complement ?? undefined,
            neighborhood: address.neighborhood ?? undefined,
            city: address.city ?? undefined,
            state: address.state ?? undefined,
          },
          phone_number: undefined,
          mobile_number: undefined,
        },
      });
    });

    it('atualiza avatar quando arquivo é enviado', async () => {
      const user = makeUser();
      const updatedUser = {
        ...user,
        avatar: '/uploads/avatars/123456789-new.png',
      };
      const req = { user: { userId: 'user-1' } };
      const dto = { name: 'Updated Name' };
      const avatarFile = makeAvatarMockFile('new.png', 'image/png');

      usersService.updateProfile.mockResolvedValue(updatedUser as any);
      establishmentsService.findByUserId.mockResolvedValue(null);

      const result = await controller.patchMe(req, dto, avatarFile);

      expect(usersService.updateProfile).toHaveBeenCalledWith('user-1', {
        ...dto,
        avatar: '/uploads/avatars/123456789-new.png',
      });

      expect(result).toEqual({
        userId: updatedUser.userId,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        establishment: undefined,
      });
      expect(addressesService.findById).not.toHaveBeenCalled();
    });

    it('retorna establishment como undefined quando não encontrado', async () => {
      const user = makeUser();
      usersService.updateProfile.mockResolvedValue(user);
      establishmentsService.findByUserId.mockResolvedValue(null);
      const req = { user: { userId: 'user-1' } };
      const result = await controller.patchMe(req, {});
      expect(result.establishment).toBeUndefined();
    });
  });

  describe('patchEstablishment()', () => {
    it('atualiza endereço, estabelecimento e contatos no fluxo transacional', async () => {
      const user = makeUser();
      const establishment = {
        establishmentId: 'est-1',
        name: 'Restaurant',
        document: '123456789',
        documentType: 'cnpj',
        establishmentTypes: ['Restaurantes'],
        addressId: 'addr-1',
        logo: null,
        isActive: true,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const address = {
        addressId: 'addr-1',
        cep: '01310-100',
        street: 'Av. Paulista',
        number: '1000',
        complement: null,
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
      };
      usersService.findById.mockResolvedValue(user);
      establishmentsService.findByUserId.mockResolvedValue(establishment);
      addressesService.findById.mockResolvedValue(address);
      contactsService.findByOwnerId.mockResolvedValue([] as any);

      const dto = {
        establishmentName: 'Restaurant 2',
        documentType: 'cnpj' as const,
        document: '123456789',
        establishmentTypes: ['Restaurantes'],
        cep: '01310-100',
        street: 'Av. Paulista',
        number: '1000',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        phone_number: '(11) 3333-4444',
        mobile_number: '(11) 98888-7777',
      };

      const req = { user: { userId: 'user-1' } };
      const result = await controller.patchEstablishment(req, dto);

      expect(transactionService.run).toHaveBeenCalled();
      expect(addressesService.update).toHaveBeenCalledWith('addr-1', {
        cep: dto.cep,
        street: dto.street,
        number: dto.number,
        complement: undefined,
        neighborhood: dto.neighborhood,
        city: dto.city,
        state: dto.state,
      });
      expect(establishmentsService.update).toHaveBeenCalledWith('est-1', {
        name: dto.establishmentName,
        document: dto.document,
        documentType: dto.documentType,
        establishmentTypeNames: dto.establishmentTypes,
      });
      expect(contactsService.upsertEstablishmentContacts).toHaveBeenCalledWith(
        'est-1',
        dto.phone_number,
        dto.mobile_number,
      );
      expect(result.userId).toBe(user.userId);
      expect(result.establishment?.establishmentId).toBe('est-1');
    });

    it('lança NotFoundException quando não há estabelecimento', async () => {
      establishmentsService.findByUserId.mockResolvedValue(null);
      const req = { user: { userId: 'user-1' } };
      const dto = {
        establishmentName: 'R',
        documentType: 'cnpj' as const,
        document: '12345678901234',
        establishmentTypes: ['Restaurantes'],
        phone_number: '(11) 3333-4444',
        mobile_number: '(11) 98888-7777',
      };
      await expect(controller.patchEstablishment(req, dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('googleAuth()', () => {
    it('deve ser executado sem erros', async () => {
      await expect(controller.googleAuth()).resolves.toBeUndefined();
    });
  });

  describe('googleAuthRedirect()', () => {
    let mockResponse: { redirect: jest.Mock };

    beforeEach(() => {
      mockResponse = { redirect: jest.fn() };
    });

    it('redireciona com tokens quando autenticação Google bem-sucedida', async () => {
      const googleUser = {
        email: 'test@test.com',
        name: 'Test User',
        id: 'google-123',
      };
      const user = makeUser();
      const tokens = makeTokens();

      googleAuthUseCase.execute.mockResolvedValue(user);
      loginWithTokenUseCase.execute.mockResolvedValue(tokens);

      const req = { user: googleUser };
      const originalFrontendUrl = process.env.FRONTEND_URL;
      process.env.FRONTEND_URL = 'https://frontend.com';

      await controller.googleAuthRedirect(
        req,
        mockResponse as unknown as Response,
      );

      expect(googleAuthUseCase.execute).toHaveBeenCalledWith(
        googleUser.email,
        googleUser.name,
        googleUser.id,
      );
      expect(loginWithTokenUseCase.execute).toHaveBeenCalledWith(user);
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'https://frontend.com/auth/callback?access_token=jwt&refresh_token=rt',
      );

      process.env.FRONTEND_URL = originalFrontendUrl;
    });

    it('redireciona com URL padrão quando FRONTEND_URL não definido', async () => {
      const googleUser = {
        email: 'test@test.com',
        name: 'Test User',
        id: 'google-123',
      };
      const user = makeUser();
      const tokens = makeTokens();

      googleAuthUseCase.execute.mockResolvedValue(user);
      loginWithTokenUseCase.execute.mockResolvedValue(tokens);

      const req = { user: googleUser };
      const originalFrontendUrl = process.env.FRONTEND_URL;
      delete process.env.FRONTEND_URL;

      await controller.googleAuthRedirect(
        req,
        mockResponse as unknown as Response,
      );

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3001/auth/callback?access_token=jwt&refresh_token=rt',
      );

      if (originalFrontendUrl !== undefined) {
        process.env.FRONTEND_URL = originalFrontendUrl;
      }
    });

    it('lança UnauthorizedException quando dados Google inválidos', async () => {
      const req = { user: { email: '', name: '', id: '' } };

      await expect(
        controller.googleAuthRedirect(req, mockResponse as unknown as Response),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('redireciona com erro quando googleAuthUseCase falha', async () => {
      const googleUser = {
        email: 'test@test.com',
        name: 'Test User',
        id: 'google-123',
      };
      googleAuthUseCase.execute.mockRejectedValue(
        new Error('Google auth failed'),
      );

      const req = { user: googleUser };
      const originalFrontendUrl = process.env.FRONTEND_URL;
      process.env.FRONTEND_URL = 'https://frontend.com';

      await controller.googleAuthRedirect(
        req,
        mockResponse as unknown as Response,
      );

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'https://frontend.com/login?error=auth_failed',
      );

      process.env.FRONTEND_URL = originalFrontendUrl;
    });

    it('redireciona com erro quando loginWithTokenUseCase falha', async () => {
      const googleUser = {
        email: 'test@test.com',
        name: 'Test User',
        id: 'google-123',
      };
      const user = makeUser();

      googleAuthUseCase.execute.mockResolvedValue(user);
      loginWithTokenUseCase.execute.mockRejectedValue(
        new Error('Login failed'),
      );

      const req = { user: googleUser };
      const originalFrontendUrl = process.env.FRONTEND_URL;
      process.env.FRONTEND_URL = 'https://frontend.com';

      await controller.googleAuthRedirect(
        req,
        mockResponse as unknown as Response,
      );

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'https://frontend.com/login?error=auth_failed',
      );

      process.env.FRONTEND_URL = originalFrontendUrl;
    });
  });
});
