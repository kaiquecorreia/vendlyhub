import { AuthGuard } from '@nestjs/passport';
import { LocalAuthGuard } from './local-auth.guard';

describe('LocalAuthGuard', () => {
  it('é instância de AuthGuard("local")', () => {
    const guard = new LocalAuthGuard();
    expect(guard).toBeInstanceOf(AuthGuard('local'));
  });
});
