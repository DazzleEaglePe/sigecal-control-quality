import type { RequestHandler, Response } from 'express';

import type {
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
  MeResponse,
  RefreshResponse,
  UserSession,
} from '@sigecal/shared';

import {
  REFRESH_COOKIE_NAME,
  readRefreshCookie,
  refreshCookieOptions,
} from './auth.cookie.js';
import type { AuthUseCases } from './auth.types.js';

const noStore = (response: Response): void => {
  response.setHeader('Cache-Control', 'no-store');
};

export class AuthController {
  public constructor(private readonly auth: AuthUseCases) {}

  public readonly login: RequestHandler = async (
    request,
    response,
    next,
  ): Promise<void> => {
    try {
      const result = await this.auth.login(
        request.body as LoginRequest,
        request.ip,
      );
      const { refreshToken, ...data } = result;
      const body: LoginResponse = { success: true, data };
      noStore(response);
      response.cookie(
        REFRESH_COOKIE_NAME,
        refreshToken,
        refreshCookieOptions(),
      );
      response.status(200).json(body);
    } catch (error) {
      next(error);
    }
  };

  public readonly refresh: RequestHandler = async (
    request,
    response,
    next,
  ): Promise<void> => {
    try {
      const result = await this.auth.refresh(readRefreshCookie(request) ?? '');
      const body: RefreshResponse = {
        success: true,
        data: { accessToken: result.accessToken },
      };
      noStore(response);
      response.cookie(
        REFRESH_COOKIE_NAME,
        result.refreshToken,
        refreshCookieOptions(),
      );
      response.status(200).json(body);
    } catch (error) {
      next(error);
    }
  };

  public readonly logout: RequestHandler = async (
    request,
    response,
    next,
  ): Promise<void> => {
    try {
      await this.auth.logout(
        request.auth?.userId ?? '',
        readRefreshCookie(request),
        request.ip,
      );
      noStore(response);
      response.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  public readonly me: RequestHandler = async (
    request,
    response,
    next,
  ): Promise<void> => {
    try {
      const data: UserSession = await this.auth.me(request.auth?.userId ?? '');
      const body: MeResponse = {
        success: true,
        data,
      };
      response.status(200).json(body);
    } catch (error) {
      next(error);
    }
  };

  public readonly changePassword: RequestHandler = async (
    request,
    response,
    next,
  ): Promise<void> => {
    try {
      await this.auth.changePassword(
        request.auth?.userId ?? '',
        request.body as ChangePasswordRequest,
        request.ip,
      );
      noStore(response);
      response.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
