import type { Request, RequestHandler } from 'express';
import type { AuditQuery, SearchQuery } from '@sigecal/shared';

import type { DiscoveryActor, DiscoveryUseCases } from './discovery.types.js';

const actorFrom = (request: Request): DiscoveryActor => ({
  userId: request.auth?.userId ?? '',
  role: request.auth?.role ?? 'OPERARIO',
});

export class DiscoveryController {
  public constructor(private readonly discovery: DiscoveryUseCases) {}

  public readonly search: RequestHandler = async (request, response, next) => {
    try {
      const query = request.query as unknown as SearchQuery;
      const data = await this.discovery.search(query, actorFrom(request));
      response.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public readonly audit: RequestHandler = async (request, response, next) => {
    try {
      const query = request.query as unknown as AuditQuery;
      const result = await this.discovery.audit(query);
      response.json({
        success: true,
        data: result.items,
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
}
