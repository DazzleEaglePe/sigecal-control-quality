import { vi } from 'vitest';
import type {
  CancelInspectionRequest,
  CreateInspectionPlanRequest,
  CreateInspectionRequest,
  DataOrigin,
  InspectionCalendarQuery,
  InspectionListQuery,
  MyPendingInspectionQuery,
  RescheduleInspectionRequest,
  UpdateInspectionRequest,
} from '@sigecal/shared';

import type { PhysChemResultRecord } from '../physchem/physchem.types.js';
import type { StandardRecord } from '../standards/standards.types.js';

import type {
  InspectionActor,
  InspectionMutationRepositoryPort,
  InspectionReadRepositoryPort,
  InspectionRecord,
  ReadyInspectionPlanContext,
} from './inspections.types.js';

export const IDS = {
  inspection: '11111111-1111-4111-a111-111111111111',
  replacement: '22222222-2222-4222-a222-222222222222',
  batch: '33333333-3333-4333-a333-333333333333',
  stage: '44444444-4444-4444-a444-444444444444',
  pisco: '55555555-5555-4555-a555-555555555555',
  parameter: '66666666-6666-4666-a666-666666666666',
  equipment: '77777777-7777-4777-a777-777777777777',
  user: '88888888-8888-4888-a888-888888888888',
  otherUser: '99999999-9999-4999-a999-999999999999',
  template: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
} as const;

export const manager: InspectionActor = {
  userId: IDS.user,
  role: 'JEFE_CALIDAD',
};

const person = { id: IDS.user, firstName: 'Nicolle', lastName: 'Calidad' };
const equipment = {
  id: IDS.equipment,
  code: 'EQ-001',
  name: 'Alcoholímetro',
  status: 'OPERATIVO' as const,
  isActive: true,
};
const parameter = {
  id: IDS.parameter,
  code: 'GRADO_ALCOHOLICO',
  name: 'Grado alcohólico',
  type: 'FISICOQUIMICO' as const,
  unit: '% vol.',
  isActive: true,
};

export const inspectionRecord = (
  overrides: Partial<InspectionRecord> = {},
): InspectionRecord => ({
  id: IDS.inspection,
  code: 'INS-2026-0001',
  batch: { id: IDS.batch, code: 'LT-2026-0001' },
  batchId: IDS.batch,
  stage: { id: IDS.stage, code: 'DESTILACION', name: 'Destilación' },
  stageId: IDS.stage,
  type: 'FISICOQUIMICO',
  status: 'PROGRAMADA',
  scheduledDate: new Date('2026-09-15T14:00:00.000Z'),
  executedAt: null,
  responsible: person,
  responsibleId: IDS.user,
  equipment,
  equipmentId: IDS.equipment,
  rescheduledFromId: null,
  rescheduledTo: null,
  changeReason: null,
  notes: null,
  createdBy: person,
  createdById: IDS.user,
  dataOrigin: 'REAL',
  parameters: [{ parameter }],
  results: [],
  ...overrides,
});

const batchContext = {
  id: IDS.batch,
  code: 'LT-2026-0001',
  piscoTypeId: IDS.pisco,
  startDate: new Date('2026-09-01T00:00:00.000Z'),
  status: 'EN_PROCESO' as const,
  dataOrigin: 'REAL' as const,
};

export class MemoryInspectionReadRepository implements InspectionReadRepositoryPort {
  public record: InspectionRecord | null = inspectionRecord();
  public standards: readonly StandardRecord[] = [];
  public results: readonly PhysChemResultRecord[] = [];
  public references = {
    batch: batchContext,
    stage: { ...inspectionRecord().stage, isActive: true },
    responsible: { ...person, role: 'ANALISTA' as const, isActive: true },
    equipment,
    parameters: [parameter],
  };
  public planContext = {
    batch: batchContext,
    template: {
      id: IDS.template,
      piscoTypeId: IDS.pisco,
      validFrom: new Date('2026-01-01T00:00:00.000Z'),
      validTo: null,
      isActive: true,
      items: [
        {
          stageId: IDS.stage,
          type: 'FISICOQUIMICO' as const,
          offsetDaysFromBatchStart: 2,
          scheduledLocalTime: new Date('1970-01-01T09:00:00.000Z'),
          responsibleRole: 'ANALISTA' as const,
          equipmentId: IDS.equipment,
          parameters: [{ parameterId: IDS.parameter }],
        },
      ],
    },
    users: [
      {
        ...person,
        id: IDS.otherUser,
        role: 'ANALISTA' as const,
        isActive: true,
      },
    ],
  };

  public list(_query: InspectionListQuery, _actor: InspectionActor) {
    void _query;
    void _actor;
    return Promise.resolve({
      items: this.record ? [this.record] : [],
      total: 1,
    });
  }
  public calendar(_query: InspectionCalendarQuery, _actor: InspectionActor) {
    void _query;
    void _actor;
    return Promise.resolve({
      items: this.record ? [this.record] : [],
      total: 1,
    });
  }
  public myPending(_query: MyPendingInspectionQuery, _actor: InspectionActor) {
    void _query;
    void _actor;
    return Promise.resolve({
      items: this.record ? [this.record] : [],
      total: 1,
    });
  }
  public findAccessibleById() {
    return Promise.resolve(this.record);
  }
  public findDetailById() {
    return Promise.resolve(
      this.record
        ? {
            inspection: this.record,
            standards: this.standards,
            results: this.results,
          }
        : null,
    );
  }
  public findReferences(_input: CreateInspectionRequest) {
    void _input;
    return Promise.resolve(this.references);
  }
  public findPlanContext(_input: CreateInspectionPlanRequest) {
    void _input;
    return Promise.resolve(this.planContext);
  }
  public coverage() {
    return Promise.resolve({
      batch: { id: IDS.batch, code: 'LT-2026-0001' },
      stages: [
        { ...inspectionRecord().stage, count: 1 },
        {
          id: IDS.replacement,
          code: 'FERMENTACION',
          name: 'Fermentación',
          count: 0,
        },
      ],
    });
  }
}

export class MemoryInspectionMutationRepository implements InspectionMutationRepositoryPort {
  public readonly markOverdueSpy = vi.fn();
  public readonly createSpy = vi.fn();
  public readonly updateSpy = vi.fn();
  public readonly rescheduleSpy = vi.fn();
  public readonly cancelSpy = vi.fn();
  public readonly startSpy = vi.fn();
  public readonly createPlanSpy = vi.fn();

  public markOverdue(now: Date) {
    this.markOverdueSpy(now);
    return Promise.resolve(0);
  }
  public create(
    input: CreateInspectionRequest,
    origin: DataOrigin,
    actorId: string,
  ) {
    this.createSpy(input, origin, actorId);
    return Promise.resolve(IDS.inspection);
  }
  public update(id: string, input: UpdateInspectionRequest, actorId: string) {
    this.updateSpy(id, input, actorId);
    return Promise.resolve();
  }
  public reschedule(
    current: InspectionRecord,
    input: RescheduleInspectionRequest,
    actorId: string,
  ) {
    this.rescheduleSpy(current, input, actorId);
    return Promise.resolve(IDS.replacement);
  }
  public cancel(id: string, input: CancelInspectionRequest, actorId: string) {
    this.cancelSpy(id, input, actorId);
    return Promise.resolve();
  }
  public start(id: string, actorId: string) {
    this.startSpy(id, actorId);
    return Promise.resolve();
  }
  public createPlan(
    context: ReadyInspectionPlanContext,
    input: CreateInspectionPlanRequest,
    actorId: string,
  ) {
    this.createPlanSpy(context, input, actorId);
    return Promise.resolve([IDS.inspection]);
  }
}

export const createInput: CreateInspectionRequest = {
  batchId: IDS.batch,
  stageId: IDS.stage,
  type: 'FISICOQUIMICO',
  scheduledDate: '2026-09-15T09:00:00-05:00',
  responsibleId: IDS.user,
  equipmentId: IDS.equipment,
  parameterIds: [IDS.parameter],
};
