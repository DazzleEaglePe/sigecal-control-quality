import { useCallback, useEffect, useState } from 'react';
import type {
  AreaItem,
  NonConformityDetail,
  NonConformityItem,
  NonConformityListQuery,
  ProcessStageItem,
  UserItem,
} from '@sigecal/shared';

import { errorMessage } from '../admin/admin-ui.js';
import { listAreas, listUsers } from '../admin/admin-api.js';
import type { AuthorizedRequest } from '../auth/auth-context.js';
import { listCatalog } from '../masters/catalog-api.js';
import {
  getNonConformity,
  listNonConformities,
} from './nonconformities-api.js';

export const useNonConformityList = (
  request: AuthorizedRequest,
  query: NonConformityListQuery,
) => {
  const [items, setItems] = useState<readonly NonConformityItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  useEffect(() => {
    let active = true;
    void listNonConformities(request, query)
      .then((result) => {
        if (active) {
          setItems(result.data);
          setTotal(result.total);
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
  }, [query, request]);
  return { items, total, loading, error };
};

export interface NonConformityMasters {
  readonly stages: readonly ProcessStageItem[];
  readonly areas: readonly AreaItem[];
  readonly users: readonly UserItem[];
}
const emptyMasters: NonConformityMasters = {
  stages: [],
  areas: [],
  users: [],
};

const loadMasters = async (
  request: AuthorizedRequest,
): Promise<NonConformityMasters> => {
  const [stages, areas, usersResponse] = await Promise.all([
    listCatalog(request, 'stages'),
    listAreas(request, true),
    listUsers(request),
  ]);
  return { stages, areas, users: usersResponse.data };
};

export const useNonConformityMasters = (request: AuthorizedRequest) => {
  const [data, setData] = useState(emptyMasters);
  const [error, setError] = useState<string>();
  useEffect(() => {
    let active = true;
    void loadMasters(request)
      .then((result) => {
        if (active) setData(result);
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

export const useNonConformityDetail = (
  request: AuthorizedRequest,
  id: string,
) => {
  const [nonConformity, setNonConformity] = useState<NonConformityDetail>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setNonConformity(await getNonConformity(request, id));
      setError(undefined);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [id, request]);
  useEffect(() => {
    let active = true;
    void getNonConformity(request, id)
      .then((result) => {
        if (active) {
          setNonConformity(result);
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
  }, [id, request]);
  return { nonConformity, loading, error, reload };
};
