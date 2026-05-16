import { createHash } from 'crypto';

/** SHA-256 hex digest; same pattern as refresh tokens in PrismaAuthTokenRepository. */
export function hashOpaqueToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
