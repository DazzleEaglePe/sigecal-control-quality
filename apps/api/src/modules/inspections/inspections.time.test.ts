import { describe, expect, it } from 'vitest';

import { inspectionYear, scheduledFromTemplate } from './inspections.time.js';

describe('fechas de planes en America/Lima', () => {
  it('combina fecha del lote, desplazamiento y hora local', () => {
    const result = scheduledFromTemplate(
      new Date('2026-09-01T00:00:00.000Z'),
      2,
      new Date('1970-01-01T09:30:00.000Z'),
    );
    expect(result.toISOString()).toBe('2026-09-03T14:30:00.000Z');
  });

  it('genera el año del código en la zona de negocio', () => {
    expect(inspectionYear(new Date('2027-01-01T03:00:00.000Z'))).toBe('2026');
  });
});
