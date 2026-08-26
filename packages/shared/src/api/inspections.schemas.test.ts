import { describe, expect, it } from 'vitest';

import {
  CreateInspectionPlanRequestSchema,
  CreateInspectionRequestSchema,
  CreateInspectionTemplateRequestSchema,
  InspectionCalendarQuerySchema,
  UpdateInspectionRequestSchema,
} from './inspections.schemas.js';

const id = (number: number): string =>
  `${String(number).padStart(8, '0')}-1111-4111-a111-111111111111`;

const inspectionRequest = {
  batchId: id(1),
  stageId: id(2),
  type: 'FISICOQUIMICO',
  scheduledDate: '2026-09-15T09:00:00-05:00',
  responsibleId: id(3),
} as const;

const templateRequest = {
  code: 'TPL-PISCO-01',
  name: 'Plan base',
  piscoTypeId: id(1),
  validFrom: '2026-09-01',
  items: [
    {
      stageId: id(2),
      type: 'FISICOQUIMICO',
      offsetDaysFromBatchStart: 2,
      scheduledLocalTime: '09:30',
      responsibleRole: 'ANALISTA',
      parameterIds: [id(3)],
    },
  ],
};

describe('contratos de inspecciones', () => {
  it('exige parámetros únicos para una inspección fisicoquímica', () => {
    expect(
      CreateInspectionRequestSchema.safeParse({
        ...inspectionRequest,
        parameterIds: [],
      }).success,
    ).toBe(false);
    expect(
      CreateInspectionRequestSchema.safeParse({
        ...inspectionRequest,
        parameterIds: [id(4), id(4)],
      }).success,
    ).toBe(false);
    expect(
      CreateInspectionRequestSchema.safeParse({
        ...inspectionRequest,
        parameterIds: [id(4)],
      }).success,
    ).toBe(true);
  });

  it('rechaza ediciones vacías y calendarios ambiguos', () => {
    expect(UpdateInspectionRequestSchema.safeParse({}).success).toBe(false);
    expect(InspectionCalendarQuerySchema.safeParse({ month: 9 }).success).toBe(
      false,
    );
    expect(
      InspectionCalendarQuerySchema.safeParse({
        month: 9,
        year: 2026,
        dateFrom: '2026-09-01T00:00:00-05:00',
        dateTo: '2026-09-30T23:59:59-05:00',
      }).success,
    ).toBe(false);
  });
});

describe('contratos de plantillas de inspección', () => {
  it('valida vigencia, hora local y parámetros fisicoquímicos', () => {
    expect(
      CreateInspectionTemplateRequestSchema.safeParse(templateRequest).success,
    ).toBe(true);
    expect(
      CreateInspectionTemplateRequestSchema.safeParse({
        ...templateRequest,
        validTo: '2026-08-31',
      }).success,
    ).toBe(false);
  });

  it('acepta asignaciones parciales por rol y rechaza un mapa vacío', () => {
    const base = { batchId: id(1), templateId: id(2) };
    expect(
      CreateInspectionPlanRequestSchema.safeParse({
        ...base,
        responsibleByRole: { ANALISTA: id(3) },
      }).success,
    ).toBe(true);
    expect(
      CreateInspectionPlanRequestSchema.safeParse({
        ...base,
        responsibleByRole: {},
      }).success,
    ).toBe(false);
  });
});
