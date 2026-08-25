import { useEffect, useState } from 'react';

import type {
  ParameterItem,
  PiscoTypeItem,
  ProcessStageItem,
  SensoryThresholdItem,
  StandardItem,
} from '@sigecal/shared';

import { errorMessage } from '../admin/admin-ui.js';
import type { AuthorizedRequest } from '../auth/auth-context.js';
import { listCatalog } from './catalog-api.js';
import { listSensoryThresholds, listStandards } from './standards-api.js';

export interface MasterReferences {
  readonly parameters: readonly ParameterItem[];
  readonly piscoTypes: readonly PiscoTypeItem[];
  readonly stages: readonly ProcessStageItem[];
}

const emptyReferences: MasterReferences = {
  parameters: [],
  piscoTypes: [],
  stages: [],
};

export const useMasterReferences = (request: AuthorizedRequest) => {
  const [references, setReferences] = useState(emptyReferences);
  const [error, setError] = useState<string>();
  useEffect(() => {
    let active = true;
    void Promise.all([
      listCatalog(request, 'parameters'),
      listCatalog(request, 'pisco-types'),
      listCatalog(request, 'stages'),
    ])
      .then(([parameters, piscoTypes, stages]) => {
        if (active) setReferences({ parameters, piscoTypes, stages });
      })
      .catch((cause: unknown) => {
        if (active) setError(errorMessage(cause));
      });
    return () => {
      active = false;
    };
  }, [request]);
  return { references, error };
};

export const useStandardHistory = (
  request: AuthorizedRequest,
  parameterId: string,
) => {
  const [items, setItems] = useState<readonly StandardItem[]>([]);
  const [error, setError] = useState<string>();
  useEffect(() => {
    if (!parameterId) return;
    let active = true;
    void listStandards(request, parameterId)
      .then((data) => {
        if (active) {
          setItems(data);
          setError(undefined);
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(errorMessage(cause));
      });
    return () => {
      active = false;
    };
  }, [parameterId, request]);
  const add = (item: StandardItem): void => {
    if (item.parameterId === parameterId)
      setItems((current) => [item, ...current]);
  };
  return { items, error, add };
};

export const useThresholdHistory = (request: AuthorizedRequest) => {
  const [items, setItems] = useState<readonly SensoryThresholdItem[]>([]);
  const [error, setError] = useState<string>();
  useEffect(() => {
    let active = true;
    void listSensoryThresholds(request)
      .then((data) => {
        if (active) setItems(data);
      })
      .catch((cause: unknown) => {
        if (active) setError(errorMessage(cause));
      });
    return () => {
      active = false;
    };
  }, [request]);
  const add = (item: SensoryThresholdItem): void => {
    setItems((current) => [item, ...current]);
  };
  return { items, error, add };
};
