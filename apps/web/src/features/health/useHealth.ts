import { useCallback, useEffect, useState } from 'react';

import { HealthResponseSchema, type HealthData } from '@sigecal/shared';

import { getJson } from '../../lib/api-client.js';

type HealthState =
  | { readonly status: 'loading' }
  | { readonly status: 'available'; readonly data: HealthData }
  | { readonly status: 'error' };

export type HealthViewModel = HealthState & {
  readonly retry: () => void;
};

export const useHealth = (): HealthViewModel => {
  const [state, setState] = useState<HealthState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void getJson('/health', controller.signal)
      .then((body) => HealthResponseSchema.parse(body))
      .then(({ data }) => {
        setState({ status: 'available', data });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError')
          return;
        setState({ status: 'error' });
      });

    return () => {
      controller.abort();
    };
  }, [attempt]);

  return { ...state, retry };
};
