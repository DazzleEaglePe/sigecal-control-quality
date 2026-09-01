import type { Request, RequestHandler } from 'express';
import type {
  CloseNonConformityRequest,
  CreateActionRequest,
  CreateNonConformityRequest,
  NonConformityListQuery,
  UpdateActionRequest,
  UpdateNonConformityRequest,
  VerifyActionRequest,
} from '@sigecal/shared';

import { UnauthorizedError } from '../../errors/app-error.js';
import type {
  NonConformitiesUseCases,
  NonConformityActor,
} from './nonconformities.types.js';

const actorFrom = (request: Request): NonConformityActor => {
  if (!request.auth) throw new UnauthorizedError();
  return { userId: request.auth.userId, role: request.auth.role };
};
const paramId = (request: Request, name: string): string => {
  const value = request.params[name];
  return typeof value === 'string' ? value : '';
};
const entityId = (request: Request): string => paramId(request, 'id');
const actionId = (request: Request): string => paramId(request, 'actionId');

export class NonConformitiesController {
  public constructor(
    private readonly nonConformities: NonConformitiesUseCases,
  ) {}

  public readonly list: RequestHandler = async (request, response, next) => {
    try {
      const query = request.query as unknown as NonConformityListQuery;
      const result = await this.nonConformities.list(query, actorFrom(request));
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

  public readonly detail: RequestHandler = async (request, response, next) => {
    try {
      const data = await this.nonConformities.detail(
        entityId(request),
        actorFrom(request),
      );
      response.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public readonly create: RequestHandler = async (request, response, next) => {
    try {
      const data = await this.nonConformities.create(
        request.body as CreateNonConformityRequest,
        actorFrom(request),
        request.ip,
      );
      response.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public readonly update: RequestHandler = async (request, response, next) => {
    try {
      const data = await this.nonConformities.update(
        entityId(request),
        request.body as UpdateNonConformityRequest,
        actorFrom(request),
        request.ip,
      );
      response.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public readonly startAttention: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const data = await this.nonConformities.startAttention(
        entityId(request),
        actorFrom(request),
        request.ip,
      );
      response.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public readonly close: RequestHandler = async (request, response, next) => {
    try {
      const data = await this.nonConformities.close(
        entityId(request),
        request.body as CloseNonConformityRequest,
        actorFrom(request),
        request.ip,
      );
      response.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public readonly listActions: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const data = await this.nonConformities.listActions(
        entityId(request),
        actorFrom(request),
      );
      response.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public readonly createAction: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const data = await this.nonConformities.createAction(
        entityId(request),
        request.body as CreateActionRequest,
        actorFrom(request),
        request.ip,
      );
      response.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public readonly updateAction: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const data = await this.nonConformities.updateAction(
        actionId(request),
        request.body as UpdateActionRequest,
        actorFrom(request),
        request.ip,
      );
      response.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public readonly executeAction: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const data = await this.nonConformities.executeAction(
        actionId(request),
        actorFrom(request),
        request.ip,
      );
      response.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public readonly verifyAction: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const data = await this.nonConformities.verifyAction(
        actionId(request),
        request.body as VerifyActionRequest,
        actorFrom(request),
        request.ip,
      );
      response.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
