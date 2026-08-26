import type { Request, RequestHandler, Response } from 'express';
import type {
  CorrectPhysChemResultRequest,
  CreatePhysChemResultsRequest,
  PhysChemControlChartQuery,
  PhysChemHistoryQuery,
  PhysChemResultListQuery,
  ValidatePhysChemResultsRequest,
} from '@sigecal/shared';

import { UnauthorizedError } from '../../errors/app-error.js';
import type {
  ListResult,
  PhysChemActor,
  PhysChemUseCases,
} from './physchem.types.js';

const actorFrom = (request: Request): PhysChemActor => {
  if (!request.auth) throw new UnauthorizedError();
  return { userId: request.auth.userId, role: request.auth.role };
};
const entityId = (request: Request): string => {
  const value = request.params.id;
  return typeof value === 'string' ? value : '';
};
const paginated = (
  response: Response,
  query: { readonly page: number; readonly pageSize: number },
  result: ListResult,
): void => {
  response.json({
    success: true,
    data: result.data,
    meta: { page: query.page, pageSize: query.pageSize, total: result.total },
  });
};

export class PhysChemController {
  public constructor(private readonly physChem: PhysChemUseCases) {}

  public readonly list: RequestHandler = async (request, response, next) => {
    try {
      const query = request.query as unknown as PhysChemResultListQuery;
      paginated(
        response,
        query,
        await this.physChem.list(query, actorFrom(request)),
      );
    } catch (error) {
      next(error);
    }
  };

  public readonly validate: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const data = await this.physChem.validate(
        request.body as ValidatePhysChemResultsRequest,
        actorFrom(request),
      );
      response.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public readonly create: RequestHandler = async (request, response, next) => {
    try {
      const data = await this.physChem.create(
        request.body as CreatePhysChemResultsRequest,
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
      const data = await this.physChem.correct(
        entityId(request),
        request.body as CorrectPhysChemResultRequest,
        actorFrom(request),
        request.ip,
      );
      response.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public readonly history: RequestHandler = async (request, response, next) => {
    try {
      const query = request.query as unknown as PhysChemHistoryQuery;
      paginated(
        response,
        query,
        await this.physChem.history(query, actorFrom(request)),
      );
    } catch (error) {
      next(error);
    }
  };

  public readonly controlChart: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const data = await this.physChem.controlChart(
        request.query as unknown as PhysChemControlChartQuery,
        actorFrom(request),
      );
      response.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
