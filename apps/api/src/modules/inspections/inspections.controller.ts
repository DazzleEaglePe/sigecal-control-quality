import type { Request, RequestHandler, Response } from 'express';
import type {
  CancelInspectionRequest,
  CreateInspectionPlanRequest,
  CreateInspectionRequest,
  InspectionCalendarQuery,
  InspectionListQuery,
  MyPendingInspectionQuery,
  RescheduleInspectionRequest,
  UpdateInspectionRequest,
} from '@sigecal/shared';

import { UnauthorizedError } from '../../errors/app-error.js';
import type {
  InspectionActor,
  InspectionsUseCases,
  ListResult,
} from './inspections.types.js';

const actorFrom = (request: Request): InspectionActor => {
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

export class InspectionsController {
  public constructor(private readonly inspections: InspectionsUseCases) {}

  public readonly list: RequestHandler = async (request, response, next) => {
    try {
      const query = request.query as unknown as InspectionListQuery;
      paginated(
        response,
        query,
        await this.inspections.list(query, actorFrom(request)),
      );
    } catch (error) {
      next(error);
    }
  };

  public readonly calendar: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const query = request.query as unknown as InspectionCalendarQuery;
      paginated(
        response,
        query,
        await this.inspections.calendar(query, actorFrom(request)),
      );
    } catch (error) {
      next(error);
    }
  };

  public readonly myPending: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const query = request.query as unknown as MyPendingInspectionQuery;
      paginated(
        response,
        query,
        await this.inspections.myPending(query, actorFrom(request)),
      );
    } catch (error) {
      next(error);
    }
  };

  public readonly get: RequestHandler = async (request, response, next) => {
    try {
      const data = await this.inspections.get(
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
      const data = await this.inspections.create(
        request.body as CreateInspectionRequest,
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
      const data = await this.inspections.update(
        entityId(request),
        request.body as UpdateInspectionRequest,
        actorFrom(request),
        request.ip,
      );
      response.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public readonly reschedule: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const data = await this.inspections.reschedule(
        entityId(request),
        request.body as RescheduleInspectionRequest,
        actorFrom(request),
        request.ip,
      );
      response.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public readonly cancel: RequestHandler = async (request, response, next) => {
    try {
      const data = await this.inspections.cancel(
        entityId(request),
        request.body as CancelInspectionRequest,
        actorFrom(request),
        request.ip,
      );
      response.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public readonly start: RequestHandler = async (request, response, next) => {
    try {
      const data = await this.inspections.start(
        entityId(request),
        actorFrom(request),
        request.ip,
      );
      response.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public readonly coverage: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const query = request.query as unknown as { batchId: string };
      const data = await this.inspections.coverage(
        query.batchId,
        actorFrom(request),
      );
      response.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public readonly createPlan: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const data = await this.inspections.createPlan(
        request.body as CreateInspectionPlanRequest,
        actorFrom(request),
        request.ip,
      );
      response.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
