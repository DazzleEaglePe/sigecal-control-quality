import { describe, expect, it } from 'vitest';

import { permissionsFor } from './permissions.js';

describe('matriz única de permisos', () => {
  it('reserva usuarios al ADMIN y auditoría a ADMIN/JEFATURA', () => {
    expect(permissionsFor('ADMIN')).toContain('USERS_MANAGE');
    expect(permissionsFor('JEFE_CALIDAD')).not.toContain('USERS_MANAGE');
    expect(permissionsFor('JEFE_CALIDAD')).toContain('AUDIT_VIEW');
    expect(permissionsFor('ANALISTA')).not.toContain('AUDIT_VIEW');
  });

  it('limita al OPERARIO a su operación documentada', () => {
    expect(permissionsFor('OPERARIO')).toEqual([
      'BATCHES_OPERATE',
      'NONCONFORMITIES_RECORD',
      'DASHBOARD_VIEW',
    ]);
  });
});
