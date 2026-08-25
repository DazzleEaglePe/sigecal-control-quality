import type { Request, RequestHandler } from 'express';

import type { CreateAreaRequest, UpdateAreaRequest } from '@sigecal/shared';

import type { AreasUseCases } from './areas.types.js';

const entityId = (request: Request): string => {
  const value = request.params.id;
  return typeof value === 'string' ? value : '';
};

export class AreasController {
  public constructor(private readonly areas: AreasUseCases) {}

  public readonly list: RequestHandler = async (request, response, next) => {
    try {
      const data = await this.areas.list(request.query);
      response.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public readonly create: RequestHandler = async (request, response, next) => {
    try {
      const data = await this.areas.create(
        request.body as CreateAreaRequest,
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
      const data = await this.areas.update(
        entityId(request),
        request.body as UpdateAreaRequest,
        request.auth?.userId ?? '',
        request.ip,
      );
      response.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
