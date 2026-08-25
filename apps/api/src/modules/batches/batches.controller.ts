import type { Request, RequestHandler } from 'express';
import type {
  AdvanceBatchStageRequest,
  BatchListQuery,
  CreateBatchRequest,
  RejectBatchRequest,
  UpdateBatchRequest,
} from '@sigecal/shared';

import { UnauthorizedError } from '../../errors/app-error.js';
import { createBatchQr } from './batches.qr.js';
import type { BatchActor, BatchesUseCases } from './batches.types.js';

const entityId = (request: Request): string => {
  const value = request.params.id;
  return typeof value === 'string' ? value : '';
};
const actorFrom = (request: Request): BatchActor => {
  if (!request.auth) throw new UnauthorizedError();
  return { userId: request.auth.userId, role: request.auth.role };
};

export class BatchesController {
  public constructor(private readonly batches: BatchesUseCases) {}

  public readonly list: RequestHandler = async (request, response, next) => {
    try {
      const query = request.query as unknown as BatchListQuery;
      const result = await this.batches.list(query, actorFrom(request));
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
      const data = await this.batches.get(
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
      const data = await this.batches.create(
        request.body as CreateBatchRequest,
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
      const data = await this.batches.update(
        entityId(request),
        request.body as UpdateBatchRequest,
        actorFrom(request),
        request.ip,
      );
      response.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public readonly timeline: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const data = await this.batches.timeline(
        entityId(request),
        actorFrom(request),
      );
      response.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public readonly advance: RequestHandler = async (request, response, next) => {
    try {
      const data = await this.batches.advance(
        entityId(request),
        request.body as AdvanceBatchStageRequest,
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
      const data = await this.batches.close(
        entityId(request),
        actorFrom(request),
        request.ip,
      );
      response.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public readonly reject: RequestHandler = async (request, response, next) => {
    try {
      const data = await this.batches.reject(
        entityId(request),
        request.body as RejectBatchRequest,
        actorFrom(request),
        request.ip,
      );
      response.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public readonly traceability: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const id = entityId(request);
      const actor = actorFrom(request);
      const batch = await this.batches.get(id, actor);
      const timeline = await this.batches.timeline(id, actor);
      response.json({ success: true, data: { batch, timeline } });
    } catch (error) {
      next(error);
    }
  };

  public readonly qr: RequestHandler = async (request, response, next) => {
    try {
      const id = entityId(request);
      await this.batches.get(id, actorFrom(request));
      response.type('image/svg+xml').send(await createBatchQr(id));
    } catch (error) {
      next(error);
    }
  };
}
