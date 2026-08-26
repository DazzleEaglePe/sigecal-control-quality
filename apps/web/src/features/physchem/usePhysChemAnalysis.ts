import { useEffect, useState } from 'react';
import type {
  ParameterItem,
  PhysChemControlChart,
  PhysChemResultItem,
  PiscoTypeItem,
  ProcessStageItem,
} from '@sigecal/shared';

import { errorMessage } from '../admin/admin-ui.js';
import type { AuthorizedRequest } from '../auth/auth-context.js';
import { listCatalog } from '../masters/catalog-api.js';
import {
  getPhysChemControlChart,
  getPhysChemHistory,
  listPhysChemResults,
} from './physchem-api.js';

export interface AnalysisSelection {
  readonly parameterId: string;
  readonly piscoTypeId: string;
  readonly stageId: string;
  readonly includeDemo: boolean;
}
interface AnalysisMasters {
  readonly parameters: readonly ParameterItem[];
  readonly piscoTypes: readonly PiscoTypeItem[];
  readonly stages: readonly ProcessStageItem[];
}
const emptyMasters: AnalysisMasters = {
  parameters: [],
  piscoTypes: [],
  stages: [],
};

export const useAnalysisMasters = (request: AuthorizedRequest) => {
  const [data, setData] = useState(emptyMasters);
  const [error, setError] = useState<string>();
  useEffect(() => {
    let active = true;
    void Promise.all([
      listCatalog(request, 'parameters'),
      listCatalog(request, 'pisco-types'),
      listCatalog(request, 'stages'),
    ])
      .then(([parameters, piscoTypes, stages]) => {
        if (active) setData({ parameters, piscoTypes, stages });
      })
      .catch((cause: unknown) => {
        if (active) setError(errorMessage(cause));
      });
    return () => {
      active = false;
    };
  }, [request]);
  return { data, error };
};

export const useInspectionResults = (
  request: AuthorizedRequest,
  inspectionId: string | null,
) => {
  const [items, setItems] = useState<readonly PhysChemResultItem[]>([]);
  const [error, setError] = useState<string>();
  useEffect(() => {
    if (!inspectionId) return;
    let active = true;
    void listPhysChemResults(request, {
      page: 1,
      pageSize: 100,
      inspectionId,
    })
      .then((result) => {
        if (active) setItems(result.data);
      })
      .catch((cause: unknown) => {
        if (active) setError(errorMessage(cause));
      });
    return () => {
      active = false;
    };
  }, [inspectionId, request]);
  return { items, error };
};

export const usePhysChemAnalysis = (request: AuthorizedRequest) => {
  const [items, setItems] = useState<readonly PhysChemResultItem[]>([]);
  const [chart, setChart] = useState<PhysChemControlChart>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const load = async (selection: AnalysisSelection): Promise<void> => {
    setLoading(true);
    try {
      const [history, nextChart] = await Promise.all([
        getPhysChemHistory(request, {
          parameterId: selection.parameterId,
          page: 1,
          pageSize: 100,
        }),
        getPhysChemControlChart(request, selection),
      ]);
      setItems(history.data);
      setChart(nextChart);
      setError(undefined);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  };
  return { items, chart, loading, error, load };
};
