import type { Request, RequestHandler } from 'express';
import type {
  CreateInspectionTemplateRequest,
  InspectionTemplateListQuery,
} from '@sigecal/shared';

import { UnauthorizedError } from '../../errors/app-error.js';
import type {
  InspectionTemplatesUseCases,
  TemplateActor,
} from './inspection-templates.types.js';

const actorFrom = (request: Request): TemplateActor => {
  if (!request.auth) throw new UnauthorizedError();
  return { userId: request.auth.userId, role: request.auth.role };
};
const entityId = (request: Request): string => {
  const value = request.params.id;
  return typeof value === 'string' ? value : '';
};

export class InspectionTemplatesController {
  public constructor(private readonly templates: InspectionTemplatesUseCases) {}

  public readonly list: RequestHandler = async (request, response, next) => {
    try {
      const query = request.query as unknown as InspectionTemplateListQuery;
      const result = await this.templates.list(query);
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

  public readonly create: RequestHandler = async (request, response, next) => {
    try {
      const data = await this.templates.create(
        request.body as CreateInspectionTemplateRequest,
        actorFrom(request),
        request.ip,
      );
      response.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public readonly deactivate: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const data = await this.templates.deactivate(
        entityId(request),
        actorFrom(request),
        request.ip,
      );
      response.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
