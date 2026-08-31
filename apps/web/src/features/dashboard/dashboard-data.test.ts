import { describe, expect, it, vi } from 'vitest';
import type { BatchItem, InspectionItem } from '@sigecal/shared';

import { loadAllPages, summarizeDashboard } from './dashboard-data.js';

const inspection = (
  status: InspectionItem['status'],
  dataOrigin: InspectionItem['dataOrigin'] = 'REAL',
): InspectionItem => ({ status, dataOrigin }) as InspectionItem;

const batch = (
  stage: {
    readonly id: string;
    readonly name: string;
    readonly sequence: number;
  },
  status: BatchItem['status'] = 'EN_PROCESO',
): BatchItem =>
  ({ currentStage: stage, status, dataOrigin: 'REAL' }) as BatchItem;

describe('dashboard-data', () => {
  it('agrega estados y etapas sin contar lotes terminales como activos', () => {
    const fermentation = { id: 'fer', name: 'Fermentación', sequence: 3 };
    const rest = { id: 'rep', name: 'Reposo', sequence: 5 };
    const result = summarizeDashboard(
      [
        inspection('COMPLETADA'),
        inspection('PROGRAMADA', 'DEMO'),
        inspection('VENCIDA'),
      ],
      [batch(fermentation), batch(fermentation), batch(rest, 'CERRADO')],
      2,
    );
    expect(result.completed).toBe(1);
    expect(result.pending).toBe(2);
    expect(result.demo).toBe(true);
    expect(result.activeBatchesByStage).toEqual([
      { name: 'Fermentación', count: 2 },
    ]);
    expect(
      result.inspectionStatuses.map(({ label, count }) => ({ label, count })),
    ).toEqual([
      { label: 'Programadas', count: 1 },
      { label: 'Completadas', count: 1 },
      { label: 'Vencidas', count: 1 },
    ]);
  });

  it('recupera todas las páginas antes de construir los gráficos', async () => {
    const load = vi.fn((page: number, pageSize: number) =>
      Promise.resolve({ data: [page * pageSize], total: 250 }),
    );
    await expect(loadAllPages(load)).resolves.toEqual([100, 200, 300]);
    expect(load).toHaveBeenCalledTimes(3);
  });
});
