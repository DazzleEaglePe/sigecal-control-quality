import { useCallback, useEffect, useState } from 'react';
import type {
  BatchItem,
  EquipmentItem,
  InspectionDetail,
  InspectionItem,
  InspectionListQuery,
  InspectionTemplateItem,
  ParameterItem,
  ProcessStageItem,
  AssignmentOption,
} from '@sigecal/shared';

import { errorMessage } from '../admin/admin-ui.js';
import { listAssignmentOptions } from '../admin/assignment-options-api.js';
import type { AuthorizedRequest } from '../auth/auth-context.js';
import { listBatches } from '../batches/batches-api.js';
import { listCatalog, type CatalogItem } from '../masters/catalog-api.js';
import {
  getInspection,
  listInspectionCalendar,
  listInspections,
  listInspectionTemplates,
  listPendingInspections,
} from './inspections-api.js';

interface InspectionListState {
  readonly items: readonly InspectionItem[];
  readonly total: number;
}
interface InspectionLoadResult {
  readonly data: readonly InspectionItem[];
  readonly total: number;
}
const emptyList: InspectionListState = { items: [], total: 0 };

const useInspectionLoader = (load: () => Promise<InspectionLoadResult>) => {
  const [data, setData] = useState(emptyList);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  useEffect(() => {
    let active = true;
    void load()
      .then((result) => {
        if (active) {
          setData({ items: result.data, total: result.total });
          setError(undefined);
        }
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
  }, [load]);
  return { ...data, loading, error };
};

export const useInspectionList = (
  request: AuthorizedRequest,
  query: InspectionListQuery,
) => {
  const load = useCallback(
    () => listInspections(request, query),
    [query, request],
  );
  return useInspectionLoader(load);
};

export const usePendingInspections = (request: AuthorizedRequest) => {
  const load = useCallback(
    () => listPendingInspections(request, { page: 1, pageSize: 6 }),
    [request],
  );
  return useInspectionLoader(load);
};

export const useInspectionCalendar = (
  request: AuthorizedRequest,
  month: number,
  year: number,
) => {
  const load = useCallback(
    () =>
      listInspectionCalendar(request, {
        month,
        year,
        page: 1,
        pageSize: 100,
      }),
    [request, month, year],
  );
  return useInspectionLoader(load);
};

export const useInspectionDetail = (request: AuthorizedRequest, id: string) => {
  const [inspection, setInspection] = useState<InspectionDetail>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setInspection(await getInspection(request, id));
      setError(undefined);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [id, request]);
  useEffect(() => {
    let active = true;
    void getInspection(request, id)
      .then((result) => {
        if (active) setInspection(result);
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
  }, [id, request]);
  return { inspection, setInspection, loading, error, reload };
};

const isEquipment = (item: CatalogItem): item is EquipmentItem =>
  'status' in item;

export interface InspectionMasters {
  readonly batches: readonly BatchItem[];
  readonly stages: readonly ProcessStageItem[];
  readonly equipment: readonly EquipmentItem[];
  readonly parameters: readonly ParameterItem[];
  readonly users: readonly AssignmentOption[];
  readonly templates: readonly InspectionTemplateItem[];
}
const emptyMasters: InspectionMasters = {
  batches: [],
  stages: [],
  equipment: [],
  parameters: [],
  users: [],
  templates: [],
};

const loadMasters = async (
  request: AuthorizedRequest,
): Promise<InspectionMasters> => {
  const [batches, stages, equipment, parameters, users, templates] =
    await Promise.all([
      listBatches(request, { page: 1, pageSize: 100 }),
      listCatalog(request, 'stages'),
      listCatalog(request, 'equipment'),
      listCatalog(request, 'parameters'),
      listAssignmentOptions(request),
      listInspectionTemplates(request, {
        page: 1,
        pageSize: 100,
        isActive: true,
      }),
    ]);
  return {
    batches: batches.data,
    stages,
    equipment: equipment.filter(isEquipment),
    parameters,
    users: users.data,
    templates: templates.data,
  };
};

export const useInspectionMasters = (request: AuthorizedRequest) => {
  const [data, setData] = useState<InspectionMasters>(emptyMasters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  useEffect(() => {
    let active = true;
    void loadMasters(request)
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

export const useInspectionFilterMasters = (
  request: AuthorizedRequest,
  includeUsers: boolean,
) => {
  const [stages, setStages] = useState<readonly ProcessStageItem[]>([]);
  const [users, setUsers] = useState<readonly AssignmentOption[]>([]);
  const [error, setError] = useState<string>();
  useEffect(() => {
    let active = true;
    const usersRequest = includeUsers
      ? listAssignmentOptions(request).then((response) => response.data)
      : Promise.resolve([]);
    void Promise.all([listCatalog(request, 'stages'), usersRequest])
      .then(([nextStages, nextUsers]) => {
        if (active) {
          setStages(nextStages);
          setUsers(nextUsers);
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(errorMessage(cause));
      });
    return () => {
      active = false;
    };
  }, [includeUsers, request]);
  return { data: { stages, users }, error };
};
