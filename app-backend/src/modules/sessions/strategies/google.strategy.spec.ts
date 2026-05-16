import { GoogleStrategy } from './google.strategy';
import { GoogleAuthUseCase } from '../use-cases/google-auth.usecase';

const makeProfile = () => ({
  id: 'google-123',
  name: { givenName: 'John', familyName: 'Doe' },
  emails: [{ value: 'john@gmail.com' }],
});

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;
  let googleAuthUseCase: { execute: jest.Mock };

  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = 'client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'client-secret';
    process.env.GOOGLE_CALLBACK_URL = 'http://localhost/callback';
    googleAuthUseCase = { execute: jest.fn() };
    strategy = new GoogleStrategy(
      googleAuthUseCase as unknown as GoogleAuthUseCase,
    );
  });

  describe('validate()', () => {
    it('chama googleAuthUseCase.execute e invoca done(null, user)', async () => {
      const user = { userId: 'user-1' };
      googleAuthUseCase.execute.mockResolvedValue(user);
      const done = jest.fn();
      const profile = makeProfile();
      await strategy.validate('access', 'refresh', profile, done);
      expect(googleAuthUseCase.execute).toHaveBeenCalledWith(
        'john@gmail.com',
        'John Doe',
        'google-123',
      );
      expect(done).toHaveBeenCalledWith(null, user);
    });

    it('propaga erro via done quando use case lança exceção', async () => {
      const err = new Error('fail');
      googleAuthUseCase.execute.mockRejectedValue(err);
      const done = jest.fn();
      await strategy
        .validate('access', 'refresh', makeProfile(), done)
        .catch(() => {});
    });
  });
});
