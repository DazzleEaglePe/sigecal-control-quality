import { useEffect, useState } from 'react';
import type { AuditItem, AuditQuery } from '@sigecal/shared';

import { errorMessage } from '../admin/admin-ui.js';
import type { AuthorizedRequest } from '../auth/auth-context.js';
import { listAudit } from './discovery-api.js';

interface AuditState {
  readonly key?: string;
  readonly items: readonly AuditItem[];
  readonly total: number;
  readonly error?: string;
}

export const useAuditLog = (request: AuthorizedRequest, query: AuditQuery) => {
  const key = JSON.stringify(query);
  const [state, setState] = useState<AuditState>({ items: [], total: 0 });
  useEffect(() => {
    const controller = new AbortController();
    void listAudit(request, query, controller.signal)
      .then((response) => {
        setState({
          key,
          items: response.data,
          total: response.meta?.total ?? response.data.length,
        });
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setState({ key, items: [], total: 0, error: errorMessage(cause) });
        }
      });
    return () => {
      controller.abort();
    };
  }, [key, query, request]);
  return { ...state, loading: state.key !== key };
};
