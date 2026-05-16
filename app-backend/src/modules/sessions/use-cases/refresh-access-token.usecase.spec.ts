import { UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { RefreshAccessTokenUseCase } from './refresh-access-token.usecase';
import {
  MockSessionsService,
  MockJwtService,
} from '../../../shared/types/test-mocks.types';

describe('RefreshAccessTokenUseCase', () => {
  let useCase: RefreshAccessTokenUseCase;
  let sessionsService: MockSessionsService;
  let jwtService: MockJwtService;

  beforeEach(() => {
    sessionsService = { findTokenByHash: jest.fn(), createToken: jest.fn() };
    jwtService = {
      sign: jest.fn().mockReturnValue('new-jwt'),
      verify: jest.fn(),
    };
    useCase = new RefreshAccessTokenUseCase(
      sessionsService as any,
      jwtService as any,
    );
  });

  it('retorna novo access_token quando refreshToken é válido', async () => {
    const refreshToken = 'valid-token';
    const hash = createHash('sha256').update(refreshToken).digest('hex');
    const token = {
      authTokenId: 'token-1',
      userId: 'user-1',
      refreshTokenHash: hash,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      createdAt: new Date(),
      user: {
        userId: 'user-1',
        email: 'test@test.com',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
    sessionsService.findTokenByHash.mockResolvedValue(token);
    const result = await useCase.execute(refreshToken);
    expect(sessionsService.findTokenByHash).toHaveBeenCalledWith(hash);
    expect(result).toEqual({ access_token: 'new-jwt' });
  });

  it('lança UnauthorizedException quando token não encontrado', async () => {
    sessionsService.findTokenByHash.mockResolvedValue(null);
    await expect(useCase.execute('missing')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('lança UnauthorizedException quando token expirado', async () => {
    const token = {
      authTokenId: 'token-2',
      userId: 'user-1',
      refreshTokenHash: 'expired-hash',
      expiresAt: new Date(Date.now() - 1000),
      createdAt: new Date(Date.now() - 2000),
      user: {
        userId: 'user-1',
        email: 'test@test.com',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
    sessionsService.findTokenByHash.mockResolvedValue(token);
    await expect(useCase.execute('expired')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
