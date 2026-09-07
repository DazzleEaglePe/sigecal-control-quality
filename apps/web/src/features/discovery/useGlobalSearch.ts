import { useEffect, useState } from 'react';
import type { SearchResponseData, SearchType } from '@sigecal/shared';

import { errorMessage } from '../admin/admin-ui.js';
import type { AuthorizedRequest } from '../auth/auth-context.js';
import { searchRecords } from './discovery-api.js';

const empty: SearchResponseData = {
  batches: [],
  inspections: [],
  nonConformities: [],
  total: 0,
};
interface SearchState {
  readonly key?: string;
  readonly data: SearchResponseData;
  readonly error?: string;
}

export const useGlobalSearch = (
  request: AuthorizedRequest,
  query: string,
  types?: readonly SearchType[],
  limit = 8,
) => {
  const term = query.trim();
  const key = `${term}|${types?.join(',') ?? ''}|${limit.toString()}`;
  const [state, setState] = useState<SearchState>({ data: empty });
  useEffect(() => {
    if (term.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void searchRecords(request, term, types, limit, controller.signal)
        .then((data) => {
          setState({ key, data });
        })
        .catch((cause: unknown) => {
          if (!controller.signal.aborted) {
            setState({ key, data: empty, error: errorMessage(cause) });
          }
        });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [key, limit, request, term, types]);
  if (term.length < 2) return { data: empty, error: undefined, loading: false };
  return { ...state, loading: state.key !== key };
};
