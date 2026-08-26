import {
  useState,
  type Dispatch,
  type SetStateAction,
  type SyntheticEvent,
} from 'react';
import type {
  CreatePhysChemResultsRequest,
  InspectionItem,
  PhysChemResultItem,
  PhysChemValidation,
} from '@sigecal/shared';

import { errorMessage } from '../admin/admin-ui.js';
import type { AuthorizedRequest } from '../auth/auth-context.js';
import {
  createPhysChemResults,
  validatePhysChemResults,
} from './physchem-api.js';

export interface PhysChemExecutionProps {
  readonly request: AuthorizedRequest;
  readonly inspection: InspectionItem;
  readonly completed: () => Promise<void>;
}
export type Drafts = Readonly<Record<string, string>>;
export type Validations = Readonly<Record<string, PhysChemValidation>>;
type Setter<T> = Dispatch<SetStateAction<T>>;
type Results = CreatePhysChemResultsRequest['results'];

const measurements = (drafts: Drafts): Results =>
  Object.entries(drafts)
    .filter(([, value]) => value.trim() !== '')
    .map(([parameterId, value]) => ({ parameterId, value: Number(value) }));

interface ExecutionContext extends PhysChemExecutionProps {
  readonly drafts: Drafts;
  readonly setValidations: Setter<Validations>;
  readonly setSaved: Setter<readonly PhysChemResultItem[]>;
  readonly setError: Setter<string | undefined>;
  readonly setSaving: Setter<boolean>;
}

const runPreview = async (
  context: ExecutionContext,
  parameterId: string,
): Promise<void> => {
  const value = context.drafts[parameterId];
  if (!value) return;
  try {
    const [result] = await validatePhysChemResults(context.request, {
      inspectionId: context.inspection.id,
      results: [{ parameterId, value: Number(value) }],
    });
    if (result)
      context.setValidations((current) => ({
        ...current,
        [parameterId]: result,
      }));
    context.setError(undefined);
  } catch (cause) {
    context.setError(errorMessage(cause));
  }
};

const confirmed = async (
  context: ExecutionContext,
  results: Results,
): Promise<boolean> => {
  const previewed = await validatePhysChemResults(context.request, {
    inspectionId: context.inspection.id,
    results,
  });
  const count = previewed.filter(
    (item) => item.status === 'NO_CONFORME',
  ).length;
  return window.confirm(
    `Se guardarán ${String(results.length)} resultado(s) definitivos y se generarán ${String(count)} NC. ¿Continuar?`,
  );
};

const runSave = async (
  context: ExecutionContext,
  event: SyntheticEvent<HTMLFormElement>,
): Promise<void> => {
  event.preventDefault();
  const results = measurements(context.drafts).filter(
    (item) =>
      !context.inspection.recordedParameterIds.includes(item.parameterId),
  );
  if (results.length === 0) {
    context.setError('Ingrese al menos una medición pendiente.');
    return;
  }
  try {
    if (!(await confirmed(context, results))) return;
    context.setSaving(true);
    const saved = await createPhysChemResults(context.request, {
      inspectionId: context.inspection.id,
      results,
    });
    context.setSaved(saved);
    context.setError(undefined);
    await context.completed();
  } catch (cause) {
    context.setError(errorMessage(cause));
  } finally {
    context.setSaving(false);
  }
};

export interface ExecutionState {
  readonly drafts: Drafts;
  readonly validations: Validations;
  readonly saved: readonly PhysChemResultItem[];
  readonly error: string | undefined;
  readonly saving: boolean;
  readonly change: (id: string, value: string) => void;
  readonly preview: (id: string) => Promise<void>;
  readonly submit: (event: SyntheticEvent<HTMLFormElement>) => Promise<void>;
}

export const usePhysChemExecution = (
  props: PhysChemExecutionProps,
): ExecutionState => {
  const [drafts, setDrafts] = useState<Drafts>({});
  const [validations, setValidations] = useState<Validations>({});
  const [saved, setSaved] = useState<readonly PhysChemResultItem[]>([]);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const context = {
    ...props,
    drafts,
    setValidations,
    setSaved,
    setError,
    setSaving,
  };
  return {
    drafts,
    validations,
    saved,
    error,
    saving,
    change: (id, value) => {
      setDrafts((current) => ({ ...current, [id]: value }));
    },
    preview: (id) => runPreview(context, id),
    submit: (event) => runSave(context, event),
  };
};
