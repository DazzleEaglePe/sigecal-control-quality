import { fileURLToPath } from 'node:url';

import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

loadEnv({
  path: fileURLToPath(new URL('../../../../.env', import.meta.url)),
  quiet: true,
});

const EnvironmentSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
    CORS_ORIGIN: z.url(),
    API_PREFIX: z.string().regex(/^\/[a-z0-9/-]+$/),
    DATABASE_URL: z.string().startsWith('postgresql://'),
    JWT_ACCESS_SECRET: z.string().min(64),
    JWT_REFRESH_SECRET: z.string().min(64),
    JWT_ACCESS_EXPIRES: z.string().regex(/^\d+[smhd]$/),
    JWT_REFRESH_EXPIRES: z.string().regex(/^\d+[smhd]$/),
    BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(14),
    COOKIE_SECURE: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true'),
    COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']),
    COOKIE_PATH: z.string().startsWith('/'),
    MAX_LOGIN_ATTEMPTS: z.coerce.number().int().min(1).max(20),
    LOCKOUT_MINUTES: z.coerce.number().int().min(1).max(1_440),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1_000),
    RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(100),
  })
  .refine((value) => value.JWT_ACCESS_SECRET !== value.JWT_REFRESH_SECRET, {
    message: 'Los secretos JWT deben ser diferentes.',
  });

export type Environment = z.infer<typeof EnvironmentSchema>;

export const parseEnvironment = (source: NodeJS.ProcessEnv): Environment =>
  EnvironmentSchema.parse(source);

export const env = parseEnvironment(process.env);
