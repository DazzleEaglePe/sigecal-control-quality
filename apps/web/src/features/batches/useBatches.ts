import { useCallback, useEffect, useState } from 'react';
import type {
  BatchItem,
  BatchListQuery,
  BatchTimelineEntry,
  GrapeVarietyItem,
  PiscoTypeItem,
  ProcessStageItem,
} from '@sigecal/shared';

import { errorMessage } from '../admin/admin-ui.js';
import type { AuthorizedRequest } from '../auth/auth-context.js';
import { listCatalog } from '../masters/catalog-api.js';
import { getBatch, getBatchTimeline, listBatches } from './batches-api.js';

export const useBatchList = (
  request: AuthorizedRequest,
  query: BatchListQuery,
) => {
  const [items, setItems] = useState<readonly BatchItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  useEffect(() => {
    let active = true;
    void listBatches(request, query)
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

export interface BatchMasters {
  readonly piscoTypes: readonly PiscoTypeItem[];
  readonly varieties: readonly GrapeVarietyItem[];
  readonly stages: readonly ProcessStageItem[];
}
const emptyMasters: BatchMasters = {
  piscoTypes: [],
  varieties: [],
  stages: [],
};

export const useBatchMasters = (request: AuthorizedRequest) => {
  const [data, setData] = useState(emptyMasters);
  const [error, setError] = useState<string>();
  useEffect(() => {
    let active = true;
    void Promise.all([
      listCatalog(request, 'pisco-types'),
      listCatalog(request, 'varieties'),
      listCatalog(request, 'stages'),
    ])
      .then(([piscoTypes, varieties, stages]) => {
        if (active) setData({ piscoTypes, varieties, stages });
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

const loadDetail = (request: AuthorizedRequest, id: string) =>
  Promise.all([getBatch(request, id), getBatchTimeline(request, id)]);

export const useBatchDetail = (request: AuthorizedRequest, id: string) => {
  const [batch, setBatch] = useState<BatchItem>();
  const [timeline, setTimeline] = useState<readonly BatchTimelineEntry[]>([]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [nextBatch, nextTimeline] = await loadDetail(request, id);
      setBatch(nextBatch);
      setTimeline(nextTimeline);
      setError(undefined);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [id, request]);
  useEffect(() => {
    let active = true;
    void loadDetail(request, id)
      .then(([nextBatch, nextTimeline]) => {
        if (active) {
          setBatch(nextBatch);
          setTimeline(nextTimeline);
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
  return { batch, timeline, loading, error, reload, setBatch };
};
