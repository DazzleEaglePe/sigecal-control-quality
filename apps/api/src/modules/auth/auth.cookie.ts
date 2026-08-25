import type { CookieOptions, Request } from 'express';

import { env } from '../../config/env.js';

export const REFRESH_COOKIE_NAME = 'sigecal_refresh';

export const refreshCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAME_SITE,
  path: env.COOKIE_PATH,
});

export const readRefreshCookie = (request: Request): string | undefined => {
  const cookies: unknown = request.cookies;
  if (!cookies || typeof cookies !== 'object') return undefined;
  const value = Reflect.get(cookies, REFRESH_COOKIE_NAME) as unknown;
  return typeof value === 'string' ? value : undefined;
};
