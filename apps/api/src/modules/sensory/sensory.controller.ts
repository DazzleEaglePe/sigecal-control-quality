import type { Request, RequestHandler } from 'express';
import type {
  CorrectSensorySessionRequest,
  CreateSensorySessionRequest,
  SensoryCompareQuery,
  SensorySessionListQuery,
} from '@sigecal/shared';
import { UnauthorizedError } from '../../errors/app-error.js';
import type { SensoryActor, SensoryUseCases } from './sensory.types.js';

const actorFrom = (request: Request): SensoryActor => {
  if (!request.auth) throw new UnauthorizedError();
  return { userId: request.auth.userId, role: request.auth.role };
};
const idFrom = (request: Request): string =>
  typeof request.params.id === 'string' ? request.params.id : '';

export class SensoryController {
  public constructor(private readonly sensory: SensoryUseCases) {}

  public readonly list: RequestHandler = async (request, response, next) => {
    try {
      const query = request.query as unknown as SensorySessionListQuery;
      const result = await this.sensory.list(query, actorFrom(request));
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
      response.json({
        success: true,
        data: await this.sensory.detail(idFrom(request), actorFrom(request)),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly create: RequestHandler = async (request, response, next) => {
    try {
      const data = await this.sensory.create(
        request.body as CreateSensorySessionRequest,
        actorFrom(request),
        request.ip,
      );
      response.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public readonly correct: RequestHandler = async (request, response, next) => {
    try {
      const data = await this.sensory.correct(
        idFrom(request),
        request.body as CorrectSensorySessionRequest,
        actorFrom(request),
        request.ip,
      );
      response.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public readonly profile: RequestHandler = async (request, response, next) => {
    try {
      response.json({
        success: true,
        data: await this.sensory.profile(idFrom(request), actorFrom(request)),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly compare: RequestHandler = async (request, response, next) => {
    try {
      response.json({
        success: true,
        data: await this.sensory.compare(
          request.query as unknown as SensoryCompareQuery,
          actorFrom(request),
        ),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly panelistOptions: RequestHandler = async (
    _request,
    response,
    next,
  ) => {
    try {
      response.json({
        success: true,
        data: await this.sensory.panelistOptions(),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly preparation: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const inspectionId =
        typeof request.query.inspectionId === 'string'
          ? request.query.inspectionId
          : '';
      response.json({
        success: true,
        data: await this.sensory.preparation(inspectionId, actorFrom(request)),
      });
    } catch (error) {
      next(error);
    }
  };
}
