import { Role } from '@sigecal/shared';
import { vi } from 'vitest';

import { Prisma } from '../../generated/prisma/client.js';
import type { StandardRecord } from '../standards/standards.types.js';
import type {
  CorrectionContext,
  EvaluatedMeasurement,
  PhysChemActor,
  PhysChemInspectionContext,
  PhysChemMutationRepositoryPort,
  PhysChemReadRepositoryPort,
  PhysChemResultRecord,
} from './physchem.types.js';

export const IDS = {
  inspection: '11111111-1111-4111-8111-111111111111',
  parameter: '22222222-2222-4222-8222-222222222222',
  standard: '33333333-3333-4333-8333-333333333333',
  equipment: '44444444-4444-4444-8444-444444444444',
  user: '55555555-5555-4555-8555-555555555555',
  otherUser: '66666666-6666-4666-8666-666666666666',
  batch: '77777777-7777-4777-8777-777777777777',
  piscoType: '88888888-8888-4888-8888-888888888888',
  stage: '99999999-9999-4999-8999-999999999999',
  result: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  replacement: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
} as const;

export const manager: PhysChemActor = {
  userId: IDS.user,
  role: Role.JEFE_CALIDAD,
};

const testParameter = {
  id: IDS.parameter,
  code: 'PAR-001',
  name: 'Grado alcohólico',
  unit: '% vol.',
  type: 'FISICOQUIMICO',
} as const;

export const standardRecord = (
  overrides: Partial<StandardRecord> = {},
): StandardRecord => ({
  id: IDS.standard,
  parameterId: IDS.parameter,
  piscoTypeId: IDS.piscoType,
  stageId: IDS.stage,
  minValue: new Prisma.Decimal(10),
  maxValue: new Prisma.Decimal(20),
  targetValue: new Prisma.Decimal(15),
  referenceNorm: 'Estándar de prueba',
  defaultSeverity: 'MODERADA',
  isProvisional: false,
  validFrom: new Date('2026-01-01T00:00:00.000Z'),
  validTo: null,
  isActive: true,
  ...overrides,
});

export const inspectionContext = (
  overrides: Partial<PhysChemInspectionContext> = {},
): PhysChemInspectionContext => ({
  id: IDS.inspection,
  code: 'INS-2026-0001',
  type: 'FISICOQUIMICO',
  status: 'EN_PROCESO',
  scheduledDate: new Date('2026-08-25T14:00:00.000Z'),
  responsibleId: IDS.user,
  equipment: {
    id: IDS.equipment,
    code: 'EQ-001',
    name: 'Densímetro',
    status: 'OPERATIVO',
    lastCalibrationRef: 'CAL-2026-001',
    isActive: true,
  },
  batch: {
    id: IDS.batch,
    code: 'LOT-2026-001',
    piscoTypeId: IDS.piscoType,
    dataOrigin: 'REAL',
  },
  stageId: IDS.stage,
  parameters: [
    {
      parameter: testParameter,
    },
  ],
  results: [],
  ...overrides,
});

export const resultRecord = (
  overrides: Partial<PhysChemResultRecord> = {},
): PhysChemResultRecord => ({
  id: IDS.result,
  inspection: { id: IDS.inspection, code: 'INS-2026-0001' },
  inspectionId: IDS.inspection,
  batch: { id: IDS.batch, code: 'LOT-2026-001' },
  parameter: testParameter,
  parameterId: IDS.parameter,
  standard: standardRecord(),
  standardId: IDS.standard,
  value: new Prisma.Decimal(15),
  status: 'CONFORME',
  observation: null,
  equipment: { id: IDS.equipment, code: 'EQ-001', name: 'Densímetro' },
  equipmentId: IDS.equipment,
  calibrationRef: 'CAL-2026-001',
  recordedBy: { id: IDS.user, firstName: 'Nicolle', lastName: 'Prueba' },
  recordedById: IDS.user,
  recordedAt: new Date('2026-08-25T15:00:00.000Z'),
  dataOrigin: 'REAL',
  annulledBy: null,
  annulledById: null,
  annulledAt: null,
  annulReason: null,
  replacesId: null,
  replacement: null,
  nonConformity: null,
  ...overrides,
});

export class MemoryPhysChemReadRepository implements PhysChemReadRepositoryPort {
  public inspection: PhysChemInspectionContext | null = inspectionContext();
  public standards: readonly StandardRecord[] = [standardRecord()];
  public records: readonly PhysChemResultRecord[] = [resultRecord()];
  public chartRows: Awaited<
    ReturnType<PhysChemReadRepositoryPort['controlChart']>
  > = [];

  public list() {
    return Promise.resolve({ items: this.records, total: this.records.length });
  }
  public findInspection() {
    return Promise.resolve(this.inspection);
  }
  public findStandards() {
    return Promise.resolve(this.standards);
  }
  public findCorrectionContext(): Promise<CorrectionContext> {
    return Promise.resolve({
      result: this.records[0] ?? null,
      inspection: this.inspection,
      equipment: this.inspection?.equipment ?? null,
    });
  }
  public findByIds(ids: readonly string[]) {
    const isCorrection = ids.length > 1;
    return Promise.resolve(
      ids.map((id) =>
        resultRecord({
          id,
          status: isCorrection && id === IDS.result ? 'ANULADO' : 'CONFORME',
        }),
      ),
    );
  }
  public history() {
    return Promise.resolve({ items: this.records, total: this.records.length });
  }
  public controlChart() {
    return Promise.resolve(this.chartRows);
  }
}

export class MemoryPhysChemMutationRepository implements PhysChemMutationRepositoryPort {
  public readonly createSpy =
    vi.fn<
      (
        inspection: PhysChemInspectionContext,
        values: readonly EvaluatedMeasurement[],
        actorId: string,
        ipAddress?: string,
      ) => void
    >();
  public readonly correctSpy =
    vi.fn<
      (
        context: Parameters<PhysChemMutationRepositoryPort['correct']>[0],
        input: Parameters<PhysChemMutationRepositoryPort['correct']>[1],
        evaluation: EvaluatedMeasurement,
        actorId: string,
        ipAddress?: string,
      ) => void
    >();

  public create(
    inspection: PhysChemInspectionContext,
    values: readonly EvaluatedMeasurement[],
    actorId: string,
    ipAddress?: string,
  ): Promise<readonly string[]> {
    this.createSpy(inspection, values, actorId, ipAddress);
    return Promise.resolve([IDS.result]);
  }

  public correct(
    context: Parameters<PhysChemMutationRepositoryPort['correct']>[0],
    input: Parameters<PhysChemMutationRepositoryPort['correct']>[1],
    evaluation: EvaluatedMeasurement,
    actorId: string,
    ipAddress?: string,
  ) {
    this.correctSpy(context, input, evaluation, actorId, ipAddress);
    return Promise.resolve({
      annulledId: IDS.result,
      replacementId: IDS.replacement,
    });
  }
}
