import { describe, expect, it } from 'vitest';

import { parseEnvironment } from './env.js';

const validEnvironment = (): NodeJS.ProcessEnv => ({
  NODE_ENV: 'test',
  PORT: '3001',
  CORS_ORIGIN: 'http://localhost:5173',
  API_PREFIX: '/api/v1',
  DATABASE_URL: 'postgresql://user:password@localhost:5432/database',
  JWT_ACCESS_SECRET: 'a'.repeat(64),
  JWT_REFRESH_SECRET: 'b'.repeat(64),
  JWT_ACCESS_EXPIRES: '15m',
  JWT_REFRESH_EXPIRES: '7d',
  BCRYPT_ROUNDS: '10',
  COOKIE_SECURE: 'false',
  COOKIE_SAME_SITE: 'strict',
  COOKIE_PATH: '/api/v1/auth',
  MAX_LOGIN_ATTEMPTS: '5',
  LOCKOUT_MINUTES: '15',
  RATE_LIMIT_WINDOW_MS: '60000',
  RATE_LIMIT_MAX: '5',
});

describe('parseEnvironment', () => {
  it('convierte y valida las variables requeridas', () => {
    expect(parseEnvironment(validEnvironment())).toMatchObject({
      NODE_ENV: 'test',
      PORT: 3001,
      API_PREFIX: '/api/v1',
    });
  });

  it('impide iniciar con un origen CORS inválido', () => {
    expect(() =>
      parseEnvironment({ ...validEnvironment(), CORS_ORIGIN: '*' }),
    ).toThrow();
  });

  it('impide reutilizar el mismo secreto para ambos tipos de token', () => {
    const environment = validEnvironment();
    expect(() =>
      parseEnvironment({
        ...environment,
        JWT_REFRESH_SECRET: environment.JWT_ACCESS_SECRET,
      }),
    ).toThrow();
  });
});
