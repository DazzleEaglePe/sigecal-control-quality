import { describe, expect, it } from 'vitest';
import type { BatchItem } from '@sigecal/shared';

import { renderTraceabilityPdf } from './reports.pdf.js';

const batch = {
  code: 'LT-2026-0001',
  piscoType: { name: 'Pisco Quebranta' },
  status: 'EN_PROCESO',
  currentStage: { name: 'Fermentación' },
  startDate: '2026-08-20',
  volumeLiters: '1500',
  dataOrigin: 'DEMO',
  harvestOrigin: 'Ica',
  varieties: [{ variety: { name: 'Quebranta' }, percentage: '100' }],
} as BatchItem;

describe('reporte PDF de trazabilidad', () => {
  it('genera un documento PDF no vacío con los datos del lote', async () => {
    const result = await renderTraceabilityPdf({
      batch,
      timeline: [],
      generatedBy: {
        fullName: 'Analista Prueba',
        email: 'analista@sigecal.demo',
      },
      emittedAt: new Date('2026-09-06T20:00:00.000Z'),
    });
    expect(result.subarray(0, 4).toString()).toBe('%PDF');
    expect(result.byteLength).toBeGreaterThan(1_000);
  });
});
