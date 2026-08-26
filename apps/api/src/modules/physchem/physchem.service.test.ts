import { describe, expect, it } from 'vitest';

import { PhysChemService } from './physchem.service.js';
import {
  IDS,
  manager,
  MemoryPhysChemMutationRepository,
  MemoryPhysChemReadRepository,
  standardRecord,
} from './physchem.test-helpers.js';

const input = {
  inspectionId: IDS.inspection,
  results: [{ parameterId: IDS.parameter, value: 15 }],
};

const setup = () => {
  const reads = new MemoryPhysChemReadRepository();
  const mutations = new MemoryPhysChemMutationRepository();
  return { reads, mutations, service: new PhysChemService(reads, mutations) };
};

describe('registro de resultados fisicoquímicos', () => {
  it('previsualiza conformidad sin persistir resultados', async () => {
    const { service, mutations } = setup();
    const result = await service.validate(input, manager);
    expect(result[0]).toMatchObject({
      parameterId: IDS.parameter,
      status: 'CONFORME',
    });
    expect(mutations.createSpy).not.toHaveBeenCalled();
  });

  it('persiste únicamente la evaluación calculada por el servidor', async () => {
    const { service, mutations } = setup();
    const result = await service.create(input, manager, '127.0.0.1');
    expect(result[0]?.status).toBe('CONFORME');
    expect(mutations.createSpy).toHaveBeenCalledOnce();
    const call = mutations.createSpy.mock.calls[0];
    expect(call?.[0].id).toBe(IDS.inspection);
    expect(call?.[1][0]).toMatchObject({
      status: 'CONFORME',
      standard: { id: IDS.standard },
    });
    expect(call?.slice(2)).toEqual([IDS.user, '127.0.0.1']);
  });
});

describe('restricciones fisicoquímicas', () => {
  it('bloquea la persistencia real sin estándar definitivo', async () => {
    const { service, reads, mutations } = setup();
    reads.standards = [standardRecord({ isProvisional: true })];
    await expect(service.create(input, manager)).rejects.toMatchObject({
      code: 'NO_EFFECTIVE_STANDARD',
    });
    expect(mutations.createSpy).not.toHaveBeenCalled();
  });

  it('restringe datos demo del gráfico a los roles autorizados', async () => {
    const { service } = setup();
    const query = {
      parameterId: IDS.parameter,
      piscoTypeId: IDS.piscoType,
      stageId: IDS.stage,
      includeDemo: true,
    };
    await expect(
      service.controlChart(query, { userId: IDS.user, role: 'ANALISTA' }),
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_PERMISSIONS' });
  });
});
