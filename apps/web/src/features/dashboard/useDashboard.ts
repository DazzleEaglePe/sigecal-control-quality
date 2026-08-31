import { useCallback, useEffect, useState } from 'react';
import type { AuthorizedRequest } from '../auth/auth-context.js';
import { listBatches } from '../batches/batches-api.js';
import {
  listInspections,
  listPendingInspections,
} from '../inspections/inspections-api.js';
import {
  loadAllPages,
  summarizeDashboard,
  type DashboardData,
} from './dashboard-data.js';

export type { DashboardData } from './dashboard-data.js';

export interface DashboardState {
  readonly data: DashboardData | undefined;
  readonly error: string | undefined;
  readonly loading: boolean;
  readonly reload: () => void;
}

const loadDashboard = async (
  request: AuthorizedRequest,
): Promise<DashboardData> => {
  const [inspections, batches, pending] = await Promise.all([
    loadAllPages((page, pageSize) =>
      listInspections(request, { page, pageSize }),
    ),
    loadAllPages((page, pageSize) => listBatches(request, { page, pageSize })),
    listPendingInspections(request, { page: 1, pageSize: 1 }),
  ]);
  return summarizeDashboard(inspections, batches, pending.total);
};

export const useDashboard = (request: AuthorizedRequest): DashboardState => {
  const [data, setData] = useState<DashboardData>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    void loadDashboard(request)
      .then((summary) => {
        if (!active) return;
        setData(summary);
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
