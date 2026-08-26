import type {
  CreateInspectionTemplateRequest,
  InspectionTemplateListQuery,
} from '@sigecal/shared';

import { ConflictError, NotFoundError } from '../../errors/app-error.js';
import { toInspectionTemplateItem } from './inspection-templates.mapper.js';
import {
  ensureTemplateManager,
  ensureTemplateReferences,
  previousTemplateId,
} from './inspection-templates.rules.js';
import type {
  InspectionTemplateRepositoryPort,
  InspectionTemplatesUseCases,
  TemplateActor,
} from './inspection-templates.types.js';

export class InspectionTemplatesService implements InspectionTemplatesUseCases {
  public constructor(
    private readonly templates: InspectionTemplateRepositoryPort,
  ) {}

  public async list(query: InspectionTemplateListQuery) {
    const result = await this.templates.list(query);
    return {
      data: result.items.map(toInspectionTemplateItem),
      total: result.total,
    };
  }

  public async create(
    input: CreateInspectionTemplateRequest,
    actor: TemplateActor,
    ipAddress?: string,
  ) {
    ensureTemplateManager(actor);
    if (await this.templates.findByCode(input.code))
      throw new ConflictError(
        'El código de plantilla ya existe.',
        'INSPECTION_TEMPLATE_CODE_EXISTS',
      );
    ensureTemplateReferences(input, await this.templates.findReferences(input));
    const previousId = previousTemplateId(
      await this.templates.findOverlaps(input),
      input.validFrom,
    );
    return toInspectionTemplateItem(
      await this.templates.create(input, actor.userId, previousId, ipAddress),
    );
  }

  public async deactivate(
    id: string,
    actor: TemplateActor,
    ipAddress?: string,
  ) {
    ensureTemplateManager(actor);
    const current = await this.templates.findById(id);
    if (!current) throw new NotFoundError('La plantilla no existe.');
    if (!current.isActive)
      throw new ConflictError(
        'La plantilla ya está inactiva.',
        'INSPECTION_TEMPLATE_INACTIVE',
      );
    return toInspectionTemplateItem(
      await this.templates.deactivate(id, actor.userId, ipAddress),
    );
  }
}
