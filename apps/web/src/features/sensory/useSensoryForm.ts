import { useMemo, useState } from 'react';
import type { SensoryPreparation, SensorySessionItem } from '@sigecal/shared';
import {
  emptyPanelist,
  generalAverage,
  panelistsFromSession,
  updatePanelist,
  type PanelistDraft,
} from './sensory-form-state.js';
import type { SensoryFormValue } from './SensoryForm.js';

const usePanelists = (initial?: SensorySessionItem) => {
  const [panelists, setPanelists] = useState<readonly PanelistDraft[]>(() =>
    initial ? panelistsFromSession(initial) : [emptyPanelist()],
  );
  const patch = (key: string, value: Partial<PanelistDraft>) => {
    setPanelists((items) => updatePanelist(items, key, value));
  };
  const remove = (key: string) => {
    setPanelists((items) => items.filter((item) => item.key !== key));
  };
  const add = () => {
    setPanelists((items) => [...items, emptyPanelist()]);
  };
  return { panelists, patch, remove, add };
};
const isReady = (
  panelists: readonly PanelistDraft[],
  average: number | null,
  correcting: boolean,
  reason: string,
) =>
  average !== null &&
  panelists.every(({ identity }) => identity.trim()) &&
  (!correcting || reason.trim().length > 0);

export const useSensoryForm = (
  preparation: SensoryPreparation,
  initial?: SensorySessionItem,
) => {
  const panel = usePanelists(initial);
  const [sessionDate, setSessionDate] = useState(
    initial?.sessionDate ?? new Date().toISOString().slice(0, 10),
  );
  const [defectsFound, setDefects] = useState(initial?.defectsFound ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [reason, setReason] = useState('');
  const average = useMemo(
    () => generalAverage(panel.panelists, preparation),
    [panel.panelists, preparation],
  );
  const value = (): SensoryFormValue => ({
    sessionDate,
    panelists: panel.panelists,
    defectsFound,
    notes,
    ...(initial ? { reason } : {}),
  });
  const ready = isReady(panel.panelists, average, Boolean(initial), reason);
  return {
    ...panel,
    sessionDate,
    setSessionDate,
    defectsFound,
    setDefects,
    notes,
    setNotes,
    reason,
    setReason,
    average,
    value,
    ready,
  };
};
export type SensoryDraft = ReturnType<typeof useSensoryForm>;
