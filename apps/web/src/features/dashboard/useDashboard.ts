import { useCallback, useEffect, useState } from 'react';
import type {
  InspectionItem,
  ReportsDashboard,
  ReportsDashboardQuery,
} from '@sigecal/shared';

import type { AuthorizedRequest } from '../auth/auth-context.js';
import { listPendingInspections } from '../inspections/inspections-api.js';
import { getDashboard } from './dashboard-api.js';

export type DashboardFilters = ReportsDashboardQuery;

export interface DashboardState {
  readonly data: ReportsDashboard | undefined;
  readonly error: string | undefined;
  readonly filters: DashboardFilters;
  readonly loading: boolean;
  readonly pending: readonly InspectionItem[];
  readonly setFilters: (filters: DashboardFilters) => void;
  readonly reload: () => void;
}

interface LoadedDashboard {
  readonly data: ReportsDashboard | undefined;
  readonly error: string | undefined;
  readonly loading: boolean;
  readonly pending: readonly InspectionItem[];
  readonly setLoading: (loading: boolean) => void;
}

const limaDate = (): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

const initialFilters = (): DashboardFilters => {
  const dateTo = limaDate();
  return {
    dateFrom: `${dateTo.slice(0, 4)}-01-01`,
    dateTo,
    includeDemo: false,
  };
};

const loadDashboard = async (
  request: AuthorizedRequest,
  filters: DashboardFilters,
): Promise<{
  readonly data: ReportsDashboard;
  readonly pending: readonly InspectionItem[];
}> => {
  const [data, pending] = await Promise.all([
    getDashboard(request, filters),
    listPendingInspections(request, { page: 1, pageSize: 5 }),
  ]);
  return { data, pending: pending.data };
};

export const useDashboard = (request: AuthorizedRequest): DashboardState => {
  const [filters, setFilters] = useState(initialFilters);
  const [nonce, setNonce] = useState(0);
  const loaded = useDashboardLoader(request, filters, nonce);
  const { setLoading, ...dashboard } = loaded;
  const reload = useCallback(() => {
    setLoading(true);
    setNonce((value) => value + 1);
  }, [setLoading]);
  const applyFilters = useCallback(
    (next: DashboardFilters) => {
      setLoading(true);
      setFilters(next);
    },
    [setLoading],
  );
  return { ...dashboard, filters, reload, setFilters: applyFilters };
};

const useDashboardLoader = (
  request: AuthorizedRequest,
  filters: DashboardFilters,
  nonce: number,
): LoadedDashboard => {
  const [data, setData] = useState<ReportsDashboard>();
  const [pending, setPending] = useState<readonly InspectionItem[]>([]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    void loadDashboard(request, filters)
      .then((result) => {
        if (!active) return;
        setData(result.data);
        setPending(result.pending);
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
  }, [filters, nonce, request]);
  return { data, error, loading, pending, setLoading };
};
