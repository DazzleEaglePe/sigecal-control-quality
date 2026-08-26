import { describe, expect, it, vi } from 'vitest';
import type {
  CreateInspectionTemplateRequest,
  InspectionTemplateListQuery,
} from '@sigecal/shared';

import { InspectionTemplatesService } from './inspection-templates.service.js';
import type {
  InspectionTemplateRecord,
  InspectionTemplateRepositoryPort,
  TemplateCatalogReferences,
} from './inspection-templates.types.js';

const IDS = {
  template: '11111111-1111-4111-a111-111111111111',
  previous: '22222222-2222-4222-a222-222222222222',
  pisco: '33333333-3333-4333-a333-333333333333',
  stage: '44444444-4444-4444-a444-444444444444',
  parameter: '55555555-5555-4555-a555-555555555555',
  user: '66666666-6666-4666-a666-666666666666',
} as const;
const input: CreateInspectionTemplateRequest = {
  code: 'TPL-PISCO-02',
  name: 'Plan de control 2026',
  piscoTypeId: IDS.pisco,
  validFrom: '2026-09-01',
  items: [
    {
      stageId: IDS.stage,
      type: 'FISICOQUIMICO',
      offsetDaysFromBatchStart: 2,
      scheduledLocalTime: '09:00',
      responsibleRole: 'ANALISTA',
      parameterIds: [IDS.parameter],
    },
  ],
};
const person = { id: IDS.user, firstName: 'Nicolle', lastName: 'Calidad' };
const templateRecord = (
  overrides: Partial<InspectionTemplateRecord> = {},
): InspectionTemplateRecord => ({
  id: IDS.template,
  code: input.code,
  name: input.name,
  piscoTypeId: IDS.pisco,
  piscoType: { id: IDS.pisco, code: 'PURO', name: 'Puro' },
  validFrom: new Date('2026-09-01T00:00:00.000Z'),
  validTo: null,
  isActive: true,
  createdBy: person,
  items: [
    {
      id: IDS.stage,
      stage: { id: IDS.stage, code: 'DESTILACION', name: 'Destilación' },
      type: 'FISICOQUIMICO',
      offsetDaysFromBatchStart: 2,
      scheduledLocalTime: new Date('1970-01-01T09:00:00.000Z'),
      responsibleRole: 'ANALISTA',
      equipment: null,
      parameters: [
        {
          parameter: {
            id: IDS.parameter,
            code: 'GRADO',
            name: 'Grado alcohólico',
            type: 'FISICOQUIMICO',
            unit: '% vol.',
          },
        },
      ],
    },
  ],
  ...overrides,
});

class MemoryTemplateRepository implements InspectionTemplateRepositoryPort {
  public current: InspectionTemplateRecord | null = null;
  public overlaps: readonly InspectionTemplateRecord[] = [];
  public references: TemplateCatalogReferences = {
    piscoTypeActive: true,
    activeStageIds: [IDS.stage],
    activeEquipmentIds: [],
    parameters: [
      { id: IDS.parameter, type: 'FISICOQUIMICO' as const, isActive: true },
    ],
  };
  public readonly createSpy = vi.fn();
  public readonly deactivateSpy = vi.fn();

  public list(_query: InspectionTemplateListQuery) {
    void _query;
    return Promise.resolve({ items: [templateRecord()], total: 1 });
  }
  public findById() {
    return Promise.resolve(this.current);
  }
  public findByCode() {
    return Promise.resolve(null);
  }
  public findOverlaps() {
    return Promise.resolve(this.overlaps);
  }
  public findReferences() {
    return Promise.resolve(this.references);
  }
  public create(
    value: CreateInspectionTemplateRequest,
    actorId: string,
    previousId?: string,
  ) {
    this.createSpy(value, actorId, previousId);
    return Promise.resolve(templateRecord());
  }
  public deactivate(id: string, actorId: string) {
    this.deactivateSpy(id, actorId);
    return Promise.resolve(templateRecord({ isActive: false }));
  }
}

const manager = { userId: IDS.user, role: 'JEFE_CALIDAD' as const };

describe('plantillas versionadas de inspección', () => {
  it('cierra la versión abierta anterior al crear la siguiente', async () => {
    const repository = new MemoryTemplateRepository();
    repository.overlaps = [
      templateRecord({
        id: IDS.previous,
        validFrom: new Date('2026-01-01T00:00:00.000Z'),
      }),
    ];
    await new InspectionTemplatesService(repository).create(input, manager);

    expect(repository.createSpy).toHaveBeenCalledWith(
      input,
      IDS.user,
      IDS.previous,
    );
  });

  it('rechaza parámetros incompatibles con el tipo de inspección', async () => {
    const repository = new MemoryTemplateRepository();
    repository.references = {
      ...repository.references,
      parameters: [{ id: IDS.parameter, type: 'SENSORIAL', isActive: true }],
    };
    await expect(
      new InspectionTemplatesService(repository).create(input, manager),
    ).rejects.toMatchObject({ code: 'PARAMETER_TYPE_MISMATCH' });
  });

  it('restringe la administración a ADMIN y JEFE_CALIDAD', async () => {
    const service = new InspectionTemplatesService(
      new MemoryTemplateRepository(),
    );
    await expect(
      service.create(input, { userId: IDS.user, role: 'ANALISTA' }),
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_PERMISSIONS' });
  });
});

describe('desactivación de plantillas', () => {
  it('mantiene el historial y evita desactivar dos veces', async () => {
    const repository = new MemoryTemplateRepository();
    repository.current = templateRecord({ isActive: false });

    await expect(
      new InspectionTemplatesService(repository).deactivate(
        IDS.template,
        manager,
      ),
    ).rejects.toMatchObject({ code: 'INSPECTION_TEMPLATE_INACTIVE' });
    expect(repository.deactivateSpy).not.toHaveBeenCalled();
  });
});
