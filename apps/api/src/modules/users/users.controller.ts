import type { Request, RequestHandler } from 'express';

import type {
  CreateUserRequest,
  UpdateUserRequest,
  UpdateUserStatusRequest,
  UserListQuery,
} from '@sigecal/shared';

import type { UsersUseCases } from './users.types.js';

const entityId = (request: Request): string => {
  const value = request.params.id;
  return typeof value === 'string' ? value : '';
};

export class UsersController {
  public constructor(private readonly users: UsersUseCases) {}

  public readonly list: RequestHandler = async (request, response, next) => {
    try {
      const query = request.query as unknown as UserListQuery;
      const result = await this.users.list(query);
      response.json({
        success: true,
        data: result.data,
        meta: {
          page: query.page,
          pageSize: query.pageSize,
          total: result.total,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly get: RequestHandler = async (request, response, next) => {
    try {
      const data = await this.users.get(entityId(request));
      response.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public readonly create: RequestHandler = async (request, response, next) => {
    try {
      const data = await this.users.create(
        request.body as CreateUserRequest,
        request.auth?.userId ?? '',
        request.ip,
      );
      response.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public readonly update: RequestHandler = async (request, response, next) => {
    try {
      const data = await this.users.update(
        entityId(request),
        request.body as UpdateUserRequest,
        request.auth?.userId ?? '',
        request.ip,
      );
      response.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public readonly setStatus: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const input = request.body as UpdateUserStatusRequest;
      const data = await this.users.setStatus(
        entityId(request),
        input.isActive,
        request.auth?.userId ?? '',
        request.ip,
      );
      response.json({ success: true, data });
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
      await this.users.resetPassword(
        entityId(request),
        request.auth?.userId ?? '',
        request.ip,
      );
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  public readonly resendInvitation: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      await this.users.resendInvitation(
        entityId(request),
        request.auth?.userId ?? '',
        request.ip,
      );
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
