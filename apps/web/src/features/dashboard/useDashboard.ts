import { useCallback, useEffect, useState } from 'react';
import type { InspectionItem } from '@sigecal/shared';

import type { AuthorizedRequest } from '../auth/auth-context.js';
import { listBatches } from '../batches/batches-api.js';
import {
  listInspections,
  listPendingInspections,
} from '../inspections/inspections-api.js';

const PAGE_SIZE = 50;

export interface DashboardData {
  readonly batches: number;
  readonly completed: number;
  readonly demo: boolean;
  readonly inspections: number;
  readonly pending: number;
  readonly recent: readonly InspectionItem[];
  readonly scheduled: number;
}

export interface DashboardState {
  readonly data: DashboardData | undefined;
  readonly error: string | undefined;
  readonly loading: boolean;
  readonly reload: () => void;
}

const summarize = (
  items: readonly InspectionItem[],
  total: number,
  batches: number,
  pending: number,
): DashboardData => ({
  batches,
  completed: items.filter((item) => item.status === 'COMPLETADA').length,
  demo: items.some((item) => item.dataOrigin === 'DEMO'),
  inspections: total,
  pending,
  recent: items.slice(0, 5),
  scheduled: items.filter((item) => item.status === 'PROGRAMADA').length,
});

export const useDashboard = (request: AuthorizedRequest): DashboardState => {
  const [data, setData] = useState<DashboardData>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    void Promise.all([
      listInspections(request, { page: 1, pageSize: PAGE_SIZE }),
      listBatches(request, { page: 1, pageSize: PAGE_SIZE }),
      listPendingInspections(request, { page: 1, pageSize: PAGE_SIZE }),
    ])
      .then(([inspections, batches, pending]) => {
        if (!active) return;
        setData(
          summarize(
            inspections.data,
            inspections.total,
            batches.total,
            pending.data.length,
          ),
        );
        setError(undefined);
      })
      .catch(() => {
        if (active) setError('No fue posible cargar el resumen operativo.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [nonce, request]);

  const reload = useCallback(() => {
    setLoading(true);
    setNonce((value) => value + 1);
  }, []);
  return { data, error, loading, reload };
};
