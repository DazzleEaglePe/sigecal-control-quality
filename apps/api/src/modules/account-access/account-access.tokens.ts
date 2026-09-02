import { createHash, randomBytes } from 'node:crypto';

import type { AccountTokenPort } from './account-access.types.js';

export class SecureAccountTokenService implements AccountTokenPort {
  public issue(): string {
    return randomBytes(32).toString('base64url');
  }

  public hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
