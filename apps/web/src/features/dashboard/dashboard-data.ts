import type { BatchItem, InspectionItem } from '@sigecal/shared';

export interface StageDatum {
  readonly count: number;
  readonly name: string;
}

export interface StatusDatum {
  readonly count: number;
  readonly label: string;
  readonly status: InspectionItem['status'];
}

export interface DashboardData {
  readonly activeBatchesByStage: readonly StageDatum[];
  readonly batches: number;
  readonly completed: number;
  readonly demo: boolean;
  readonly inspectionStatuses: readonly StatusDatum[];
  readonly inspections: number;
  readonly pending: number;
  readonly recent: readonly InspectionItem[];
  readonly scheduled: number;
}

interface Paginated<T> {
  readonly data: readonly T[];
  readonly total: number;
}

const statusLabels: Readonly<Record<InspectionItem['status'], string>> = {
  PROGRAMADA: 'Programadas',
  EN_PROCESO: 'En proceso',
  COMPLETADA: 'Completadas',
  VENCIDA: 'Vencidas',
  CANCELADA: 'Canceladas',
  REPROGRAMADA: 'Reprogramadas',
};

const statusOrder = Object.keys(statusLabels) as InspectionItem['status'][];

export const loadAllPages = async <T>(
  load: (page: number, pageSize: number) => Promise<Paginated<T>>,
  pageSize = 100,
): Promise<readonly T[]> => {
  const first = await load(1, pageSize);
  const pages = Math.ceil(first.total / pageSize);
  if (pages <= 1) return first.data;
  const remaining = await Promise.all(
    Array.from({ length: pages - 1 }, (_, index) => load(index + 2, pageSize)),
  );
  return [first, ...remaining].flatMap((page) => page.data);
};

const batchesByStage = (items: readonly BatchItem[]): readonly StageDatum[] => {
  const counts = new Map<
    string,
    { count: number; name: string; order: number }
  >();
  for (const batch of items) {
    if (batch.status === 'CERRADO' || batch.status === 'RECHAZADO') continue;
    const current = counts.get(batch.currentStage.id);
    counts.set(batch.currentStage.id, {
      count: (current?.count ?? 0) + 1,
      name: batch.currentStage.name,
      order: batch.currentStage.sequence,
    });
  }
  return [...counts.values()]
    .sort((left, right) => left.order - right.order)
    .map(({ count, name }) => ({ count, name }));
};

const inspectionsByStatus = (
  items: readonly InspectionItem[],
): readonly StatusDatum[] =>
  statusOrder
    .map((status) => ({
      status,
      label: statusLabels[status],
      count: items.filter((item) => item.status === status).length,
    }))
    .filter((item) => item.count > 0);

export const summarizeDashboard = (
  inspections: readonly InspectionItem[],
  batches: readonly BatchItem[],
  pending: number,
): DashboardData => ({
  activeBatchesByStage: batchesByStage(batches),
  batches: batches.length,
  completed: inspections.filter((item) => item.status === 'COMPLETADA').length,
  demo:
    inspections.some((item) => item.dataOrigin === 'DEMO') ||
    batches.some((item) => item.dataOrigin === 'DEMO'),
  inspectionStatuses: inspectionsByStatus(inspections),
  inspections: inspections.length,
  pending,
  recent: inspections.slice(0, 5),
  scheduled: inspections.filter((item) => item.status === 'PROGRAMADA').length,
});
