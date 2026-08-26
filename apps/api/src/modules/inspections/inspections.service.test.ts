import { describe, expect, it } from 'vitest';

import { InspectionsService } from './inspections.service.js';
import {
  createInput,
  IDS,
  inspectionRecord,
  manager,
  MemoryInspectionMutationRepository,
  MemoryInspectionReadRepository,
} from './inspections.test-helpers.js';

const setup = () => {
  const reads = new MemoryInspectionReadRepository();
  const mutations = new MemoryInspectionMutationRepository();
  return {
    reads,
    mutations,
    service: new InspectionsService(reads, mutations),
  };
};
const operationalEquipment = inspectionRecord().equipment;
if (!operationalEquipment) throw new Error('Falta el equipo de prueba.');

describe('programación de inspecciones', () => {
  it('hereda el origen del lote y conserva los metadatos del servidor', async () => {
    const { service, mutations } = setup();
    const result = await service.create(createInput, manager);

    expect(result.dataOrigin).toBe('REAL');
    expect(mutations.createSpy).toHaveBeenCalledWith(
      createInput,
      'REAL',
      IDS.user,
    );
  });

  it('impide editar una inspección que ya inició', async () => {
    const { service, reads, mutations } = setup();
    reads.record = inspectionRecord({ status: 'EN_PROCESO' });

    await expect(
      service.update(IDS.inspection, { notes: 'Cambio' }, manager),
    ).rejects.toMatchObject({ code: 'INSPECTION_NOT_EDITABLE' });
    expect(mutations.updateSpy).not.toHaveBeenCalled();
  });
});

describe('inicio y transiciones de inspección', () => {
  it('bloquea el inicio fisicoquímico sin equipo operativo', async () => {
    const { service, reads, mutations } = setup();
    reads.record = inspectionRecord({
      equipment: {
        ...operationalEquipment,
        status: 'EN_MANTENIMIENTO',
      },
    });

    await expect(service.start(IDS.inspection, manager)).rejects.toMatchObject({
      code: 'EQUIPMENT_NOT_OPERATIONAL',
    });
    expect(mutations.startSpy).not.toHaveBeenCalled();
  });

  it('limita al analista a sus inspecciones asignadas', async () => {
    const { service } = setup();
    await expect(
      service.start(IDS.inspection, {
        userId: IDS.otherUser,
        role: 'ANALISTA',
      }),
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_PERMISSIONS' });
  });

  it('reprograma creando un reemplazo y preservando el original', async () => {
    const { service, mutations } = setup();
    const input = {
      newDate: '2026-09-20T09:00:00-05:00',
      reason: 'Cambio del cronograma',
    };
    await service.reschedule(IDS.inspection, input, manager);
    expect(mutations.rescheduleSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: IDS.inspection }),
      input,
      IDS.user,
    );
  });
});

describe('cobertura y plan por plantilla', () => {
  it('reporta etapas cubiertas y no cubiertas sin ocultar el denominador', async () => {
    const { service } = setup();
    const result = await service.coverage(IDS.batch, manager);

    expect(result).toMatchObject({
      coveredStages: 1,
      totalStages: 2,
      percentage: 50,
    });
    expect(result.stages.map((stage) => stage.hasScheduledInspection)).toEqual([
      true,
      false,
    ]);
  });

  it('valida rol y vigencia antes de crear todo el plan', async () => {
    const { service, mutations } = setup();
    const input = {
      batchId: IDS.batch,
      templateId: IDS.template,
      responsibleByRole: { ANALISTA: IDS.otherUser },
    } as const;

    const result = await service.createPlan(input, manager);
    expect(result).toHaveLength(1);
    expect(mutations.createPlanSpy).toHaveBeenCalledOnce();
  });
});
