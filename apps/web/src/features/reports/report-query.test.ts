import { describe, expect, it } from 'vitest';

import { reportQueryFrom } from './report-query.js';

const form = (values: Record<string, string>): FormData => {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => {
    data.set(key, value);
  });
  return data;
};

describe('filtros de reportes', () => {
  it('convierte el periodo al horario de Perú y declara DEMO', () => {
    const query = reportQueryFrom(
      'inspections',
      form({
        dateFrom: '2026-09-01',
        dateTo: '2026-09-30',
        includeDemo: 'on',
        status: 'COMPLETADA',
      }),
      true,
    );
    expect(query).toMatchObject({
      dateFrom: '2026-09-01T00:00:00-05:00',
      dateTo: '2026-09-30T23:59:59-05:00',
      includeDemo: true,
      status: 'COMPLETADA',
    });
  });

  it('no permite solicitar DEMO desde un rol sin autorización', () => {
    const query = reportQueryFrom(
      'results',
      form({ includeDemo: 'on', parameterId: 'parameter-id' }),
      false,
    );
    expect(query).toMatchObject({
      includeDemo: false,
      parameterId: 'parameter-id',
    });
  });
});
