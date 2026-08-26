import { describe, expect, it } from 'vitest';

import {
  ensureExpectedParameters,
  ensureReadyInspection,
  evaluateMeasurements,
} from './physchem.rules.js';
import {
  IDS,
  inspectionContext,
  standardRecord,
} from './physchem.test-helpers.js';

describe('límites de la evaluación fisicoquímica', () => {
  it('considera conformes ambos límites inclusivos', () => {
    const results = evaluateMeasurements(
      [
        { parameterId: IDS.parameter, value: 10 },
        { parameterId: IDS.parameter, value: 20 },
      ],
      [standardRecord()],
      inspectionContext(),
    );
    expect(results.map((result) => result.status)).toEqual([
      'CONFORME',
      'CONFORME',
    ]);
  });

  it('detecta valores fuera del rango con comparación decimal', () => {
    const results = evaluateMeasurements(
      [
        { parameterId: IDS.parameter, value: 9.999 },
        { parameterId: IDS.parameter, value: 20.001 },
      ],
      [standardRecord()],
      inspectionContext(),
    );
    expect(results.every((result) => result.status === 'NO_CONFORME')).toBe(
      true,
    );
  });
});

describe('selección del estándar fisicoquímico', () => {
  it('bloquea datos reales cuando solo existe estándar provisional', () => {
    expect(() => {
      evaluateMeasurements(
        [{ parameterId: IDS.parameter, value: 15 }],
        [standardRecord({ isProvisional: true })],
        inspectionContext(),
      );
    }).toThrow(expect.objectContaining({ code: 'NO_EFFECTIVE_STANDARD' }));
  });

  it('prioriza el estándar específico sobre el estándar general', () => {
    const general = standardRecord({
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      piscoTypeId: null,
      stageId: null,
    });
    const [result] = evaluateMeasurements(
      [{ parameterId: IDS.parameter, value: 15 }],
      [general, standardRecord()],
      inspectionContext(),
    );
    expect(result?.standard.id).toBe(IDS.standard);
  });
});

describe('precondiciones fisicoquímicas', () => {
  it('rechaza equipos no operativos', () => {
    const current = inspectionContext();
    const equipment = current.equipment;
    if (!equipment) throw new Error('Falta el equipo de prueba.');
    expect(() => {
      ensureReadyInspection({
        ...current,
        equipment: { ...equipment, status: 'EN_MANTENIMIENTO' },
      });
    }).toThrow(expect.objectContaining({ code: 'EQUIPMENT_NOT_OPERATIONAL' }));
  });

  it('rechaza un parámetro con resultado vigente', () => {
    const inspection = inspectionContext({
      results: [
        { id: IDS.result, parameterId: IDS.parameter, status: 'CONFORME' },
      ],
    });
    expect(() => {
      ensureExpectedParameters(inspection, [IDS.parameter], true);
    }).toThrow(expect.objectContaining({ code: 'PHYS_CHEM_RESULT_EXISTS' }));
  });
});
