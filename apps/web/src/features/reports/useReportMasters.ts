import { useEffect, useState } from 'react';
import type {
  AreaItem,
  AssignmentOption,
  BatchItem,
  ParameterItem,
  ProcessStageItem,
} from '@sigecal/shared';

import { listAreas } from '../admin/admin-api.js';
import { listAssignmentOptions } from '../admin/assignment-options-api.js';
import type { AuthorizedRequest } from '../auth/auth-context.js';
import { listBatches } from '../batches/batches-api.js';
import { listCatalog } from '../masters/catalog-api.js';
import { errorMessage } from '../admin/admin-ui.js';

export interface ReportMasters {
  readonly batches: readonly BatchItem[];
  readonly stages: readonly ProcessStageItem[];
  readonly users: readonly AssignmentOption[];
  readonly areas: readonly AreaItem[];
  readonly parameters: readonly ParameterItem[];
}

const EMPTY: ReportMasters = {
  batches: [],
  stages: [],
  users: [],
  areas: [],
  parameters: [],
};

const allBatches = async (
  request: AuthorizedRequest,
): Promise<readonly BatchItem[]> => {
  const items: BatchItem[] = [];
  let page = 1;
  let total: number;
  do {
    const response = await listBatches(request, { page, pageSize: 100 });
    items.push(...response.data);
    total = response.total;
    page += 1;
    if (response.data.length === 0) break;
  } while (items.length < total);
  return items;
};

const load = async (request: AuthorizedRequest): Promise<ReportMasters> => {
  const [batches, stages, users, areas, parameters] = await Promise.all([
    allBatches(request),
    listCatalog(request, 'stages'),
    listAssignmentOptions(request),
    listAreas(request, true),
    listCatalog(request, 'parameters'),
  ]);
  return { batches, stages, users: users.data, areas, parameters };
};

export const useReportMasters = (request: AuthorizedRequest) => {
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  useEffect(() => {
    let active = true;
    void load(request)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((cause: unknown) => {
        if (active) setError(errorMessage(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [request]);
  return { data, loading, error };
};
