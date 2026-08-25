import { compare, hash } from 'bcryptjs';

import { env } from '../../config/env.js';
import type { PasswordPort } from './auth.types.js';

export class BcryptPasswordService implements PasswordPort {
  public compare(plain: string, passwordHash: string): Promise<boolean> {
    return compare(plain, passwordHash);
  }

  public hash(plain: string): Promise<string> {
    return hash(plain, env.BCRYPT_ROUNDS);
  }
}
