import type { Request, RequestHandler } from 'express';

import type {
  CatalogCreateInput,
  CatalogKind,
  CatalogsUseCases,
  CatalogUpdateInput,
} from './catalogs.types.js';

const entityId = (request: Request): string => {
  const value = request.params.id;
  return typeof value === 'string' ? value : '';
};

export class CatalogsController {
  public constructor(private readonly catalogs: CatalogsUseCases) {}

  public list(kind: CatalogKind): RequestHandler {
    return async (request, response, next) => {
      try {
        const data = await this.catalogs.list(kind, request.query);
        response.json({ success: true, data });
      } catch (error) {
        next(error);
      }
    };
  }

  public create(kind: CatalogKind): RequestHandler {
    return async (request, response, next) => {
      try {
        const data = await this.catalogs.create(
          kind,
          request.body as CatalogCreateInput,
          request.auth?.userId ?? '',
          request.ip,
        );
        response.status(201).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    };
  }

  public update(kind: CatalogKind): RequestHandler {
    return async (request, response, next) => {
      try {
        const data = await this.catalogs.update(
          kind,
          entityId(request),
          request.body as CatalogUpdateInput,
          request.auth?.userId ?? '',
          request.ip,
        );
        response.json({ success: true, data });
      } catch (error) {
        next(error);
      }
    };
  }
}
