import { describe, expect, it } from 'vitest';

import { NonConformitiesService } from './nonconformities.service.js';
import {
  actionRecord,
  createInput,
  IDS,
  manager,
  MemoryNonConformityMutationRepository,
  MemoryNonConformityReadRepository,
  nonConformityRecord,
  operator,
} from './nonconformities.test-helpers.js';

const setup = () => {
  const reads = new MemoryNonConformityReadRepository();
  const mutations = new MemoryNonConformityMutationRepository();
  return {
    reads,
    mutations,
    service: new NonConformitiesService(reads, mutations),
  };
};

describe('registro manual de no conformidades', () => {
  it('permite al operario reportar una no conformidad', async () => {
    const { service, mutations } = setup();
    const result = await service.create(createInput, operator);

    expect(result.code).toBe('NC-2026-0001');
    expect(mutations.createSpy).toHaveBeenCalledWith(
      createInput,
      'REAL',
      IDS.otherUser,
    );
  });

  it('impide al operario editar o iniciar la atención', async () => {
    const { service } = setup();
    await expect(
      service.update(IDS.nc, { description: 'Otra' }, operator),
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_PERMISSIONS' });
    await expect(
      service.startAttention(IDS.nc, operator),
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_PERMISSIONS' });
  });

  it('impide editar una no conformidad cerrada', async () => {
    const { service, reads } = setup();
    reads.record = nonConformityRecord({ status: 'CERRADA' });
    await expect(
      service.update(IDS.nc, { description: 'Otra' }, manager),
    ).rejects.toMatchObject({ code: 'NC_ALREADY_CLOSED' });
  });
});

const analyst = { userId: IDS.otherUser, role: 'ANALISTA' } as const;

describe('cierre de la no conformidad', () => {
  it('lo restringe a Jefatura de Calidad', async () => {
    const { service } = setup();
    await expect(
      service.close(IDS.nc, { closeComment: 'Resuelto' }, analyst),
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_PERMISSIONS' });
  });

  it('bloquea el cierre con una acción ejecutada sin verificar', async () => {
    const { service, reads } = setup();
    reads.actions = [actionRecord({ status: 'EJECUTADA' })];
    await expect(
      service.close(IDS.nc, { closeComment: 'Resuelto' }, manager),
    ).rejects.toMatchObject({
      code: 'NC_HAS_UNVERIFIED_ACTIONS',
    });
  });
});

describe('cierre exitoso de la no conformidad', () => {
  it('permite cerrar cuando todas las acciones ya fueron verificadas', async () => {
    const { service, reads, mutations } = setup();
    reads.actions = [
      actionRecord({ status: 'VERIFICADA', isEffective: true }),
      actionRecord({ id: 'id-2', status: 'VERIFICADA', isEffective: true }),
    ];
    await service.close(IDS.nc, { closeComment: 'Resuelto' }, manager);
    expect(mutations.closeSpy).toHaveBeenCalledWith(
      IDS.nc,
      { closeComment: 'Resuelto' },
      IDS.user,
    );
  });

  it('impide cerrar sin acciones registradas', async () => {
    const { service, mutations } = setup();
    await expect(
      service.close(IDS.nc, { closeComment: 'Resuelto' }, manager),
    ).rejects.toMatchObject({ code: 'NC_HAS_UNVERIFIED_ACTIONS' });
    expect(mutations.closeSpy).not.toHaveBeenCalled();
  });

  it('impide cerrar aunque una acción no eficaz acompañe a otra eficaz', async () => {
    const { service, reads, mutations } = setup();
    reads.actions = [
      actionRecord({ status: 'VERIFICADA' }),
      actionRecord({ status: 'NO_EFICAZ' }),
    ];
    await expect(
      service.close(IDS.nc, { closeComment: 'Resuelto' }, manager),
    ).rejects.toMatchObject({ code: 'NC_HAS_UNVERIFIED_ACTIONS' });
    expect(mutations.closeSpy).not.toHaveBeenCalled();
  });
});

describe('cierre con reemplazo de una acción no eficaz', () => {
  it('permite cerrar si una acción eficaz reemplaza a la no eficaz', async () => {
    const { service, reads, mutations } = setup();
    reads.actions = [
      actionRecord({ id: 'fallida', status: 'NO_EFICAZ' }),
      actionRecord({
        id: 'reemplazo',
        status: 'VERIFICADA',
        replacesActionId: 'fallida',
      }),
    ];
    await service.close(IDS.nc, { closeComment: 'Resuelto' }, manager);
    expect(mutations.closeSpy).toHaveBeenCalledOnce();
  });
});

describe('acciones correctivas', () => {
  it('impide verificar una acción que no fue ejecutada', async () => {
    const { service, reads } = setup();
    reads.actions = [actionRecord({ status: 'PENDIENTE' })];
    await expect(
      service.verifyAction(
        IDS.action,
        { isEffective: true, verificationComment: 'Ok' },
        manager,
      ),
    ).rejects.toMatchObject({ code: 'ACTION_NOT_EXECUTED' });
  });

  it('impide que el responsable verifique su propia acción', async () => {
    const { service, reads } = setup();
    reads.actions = [
      actionRecord({ status: 'EJECUTADA', responsibleId: IDS.user }),
    ];
    await expect(
      service.verifyAction(
        IDS.action,
        { isEffective: true, verificationComment: 'Ok' },
        manager,
      ),
    ).rejects.toMatchObject({ code: 'VERIFIER_SAME_AS_RESPONSIBLE' });
  });

  it('verifica una acción ejecutada por otra persona', async () => {
    const { service, reads, mutations } = setup();
    reads.actions = [actionRecord({ status: 'EJECUTADA' })];
    await service.verifyAction(
      IDS.action,
      { isEffective: false, verificationComment: 'No resolvió la fuga.' },
      manager,
    );
    expect(mutations.verifyActionSpy).toHaveBeenCalledWith(
      IDS.action,
      { isEffective: false, verificationComment: 'No resolvió la fuga.' },
      IDS.user,
    );
  });
});

describe('registro de acciones', () => {
  it('valida que el responsable de la acción esté activo', async () => {
    const { service, reads } = setup();
    reads.actionReferences = {
      nonConformity: reads.record,
      responsible: null,
      replacesAction: null,
    };
    await expect(
      service.createAction(
        IDS.nc,
        {
          type: 'CORRECTIVA',
          description: 'Reemplazar la válvula.',
          responsibleId: IDS.otherUser,
          committedDate: '2026-09-10',
        },
        manager,
      ),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
