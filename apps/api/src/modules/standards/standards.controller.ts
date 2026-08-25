import type { Request, RequestHandler } from 'express';

import type {
  CreateSensoryThresholdRequest,
  CreateStandardRequest,
  EffectiveSensoryThresholdQuery,
  EffectiveStandardQuery,
  StandardHistoryQuery,
  UpdateStandardRequest,
} from '@sigecal/shared';

import type { StandardsUseCases } from './standards.types.js';

const entityId = (request: Request): string => {
  const value = request.params.id;
  return typeof value === 'string' ? value : '';
};

export class StandardsController {
  public constructor(private readonly standards: StandardsUseCases) {}

  public readonly list: RequestHandler = async (request, response, next) => {
    try {
      const data = await this.standards.list(
        request.query as unknown as StandardHistoryQuery,
      );
      response.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public readonly create: RequestHandler = async (request, response, next) => {
    try {
      const data = await this.standards.create(
        request.body as CreateStandardRequest,
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
      const data = await this.standards.update(
        entityId(request),
        request.body as UpdateStandardRequest,
        request.auth?.userId ?? '',
        request.ip,
      );
      response.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public readonly effective: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const data = await this.standards.effective(
        request.query as unknown as EffectiveStandardQuery,
      );
      response.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public readonly listThresholds: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const data = await this.standards.listThresholds(request.query);
      response.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public readonly createThreshold: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const data = await this.standards.createThreshold(
        request.body as CreateSensoryThresholdRequest,
        request.auth?.userId ?? '',
        request.ip,
      );
      response.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public readonly effectiveThreshold: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const data = await this.standards.effectiveThreshold(
        request.query as unknown as EffectiveSensoryThresholdQuery,
      );
      response.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
