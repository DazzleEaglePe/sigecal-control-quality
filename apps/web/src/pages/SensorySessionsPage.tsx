import { useEffect, useState } from 'react';
import type { SensoryProfile, SensorySessionItem } from '@sigecal/shared';
import type { AuthorizedRequest } from '../features/auth/auth-context.js';
import { useAuth } from '../features/auth/useAuth.js';
import {
  compareSensoryProfiles,
  listSensorySessions,
} from '../features/sensory/sensory-api.js';
import { SensorySessionsView } from '../features/sensory/SensorySessionsView.js';

const useSensorySessions = (request: AuthorizedRequest) => {
  const [items, setItems] = useState<readonly SensorySessionItem[]>([]);
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [profiles, setProfiles] = useState<readonly SensoryProfile[]>([]);
  const [error, setError] = useState<string>();
  useEffect(() => {
    void listSensorySessions(request)
      .then(setItems)
      .catch((cause: unknown) => {
        setError(
          cause instanceof Error
            ? cause.message
            : 'No fue posible cargar las sesiones.',
        );
      });
  }, [request]);
  const compare = async () => {
    try {
      setProfiles(await compareSensoryProfiles(request, selected));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'No fue posible comparar.',
      );
    }
  };
  const toggle = (id: string, checked: boolean) => {
    setSelected((ids) =>
      checked ? [...ids, id] : ids.filter((value) => value !== id),
    );
  };
  return { items, selected, profiles, error, compare, toggle };
};

export const SensorySessionsPage = (): React.JSX.Element => {
  const { request } = useAuth();
  const state = useSensorySessions(request);
  return (
    <SensorySessionsView
      items={state.items}
      selected={state.selected}
      profiles={state.profiles}
      {...(state.error ? { error: state.error } : {})}
      toggle={state.toggle}
      compare={() => {
        void state.compare();
      }}
    />
  );
};
