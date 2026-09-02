import type { RequestHandler } from 'express';

import type {
  AccountEmailRequest,
  AccountTokenPasswordRequest,
} from '@sigecal/shared';

import type { AccountAccessUseCases } from './account-access.types.js';

const GENERIC_RESET_MESSAGE =
  'Si la cuenta está disponible, recibirá instrucciones por correo.';

export class AccountAccessController {
  public constructor(private readonly access: AccountAccessUseCases) {}

  public readonly forgotPassword: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      await this.access.requestPasswordReset(
        request.body as AccountEmailRequest,
      );
      response.status(202).json({
        success: true,
        data: { message: GENERIC_RESET_MESSAGE },
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly activate: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      await this.access.activate(request.body as AccountTokenPasswordRequest);
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  public readonly resetPassword: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      await this.access.resetPassword(
        request.body as AccountTokenPasswordRequest,
      );
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
