import { createHash } from 'crypto';
import { LogoutUserUseCase } from './logout-user.usecase';
import { SessionsService } from '../services/sessions.service';

describe('LogoutUserUseCase', () => {
  let useCase: LogoutUserUseCase;
  let sessionsService: { deleteTokenByHash: jest.Mock };

  beforeEach(() => {
    sessionsService = {
      deleteTokenByHash: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new LogoutUserUseCase(
      sessionsService as unknown as SessionsService,
    );
  });

  it('deleta o token pelo hash do refresh token', async () => {
    const refreshToken = 'my-refresh-token';
    const expectedHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    await useCase.execute(refreshToken);
    expect(sessionsService.deleteTokenByHash).toHaveBeenCalledWith(
      expectedHash,
    );
  });
});
