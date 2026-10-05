import {
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
  type SyntheticEvent,
} from 'react';
import { type NavigateFunction, useNavigate } from 'react-router-dom';
import { CreateBatchRequestSchema, type PiscoTypeItem } from '@sigecal/shared';

import { errorMessage } from '../admin/admin-ui.js';
import type { AuthorizedRequest } from '../auth/auth-context.js';
import { useAuth } from '../auth/useAuth.js';
import { createBatch } from './batches-api.js';
import {
  batchFieldNames,
  batchIssuesFrom,
  requestFrom,
  type BatchFieldIssues,
  type BatchFieldName,
} from './batch-form-validation.js';
import type { BatchMasters } from './useBatches.js';

interface BatchFormSetters {
  readonly setSelected: Dispatch<SetStateAction<readonly string[]>>;
  readonly setBusy: Dispatch<SetStateAction<boolean>>;
  readonly setError: Dispatch<SetStateAction<string | undefined>>;
  readonly setIssues: Dispatch<SetStateAction<BatchFieldIssues>>;
  readonly setTouched: Dispatch<SetStateAction<ReadonlySet<BatchFieldName>>>;
}

interface SubmitContext extends BatchFormSetters {
  readonly request: AuthorizedRequest;
  readonly navigate: NavigateFunction;
  readonly type: PiscoTypeItem | undefined;
  readonly selected: readonly string[];
}

const submitBatch = async (
  event: SyntheticEvent<HTMLFormElement>,
  context: SubmitContext,
): Promise<void> => {
  event.preventDefault();
  const form = event.currentTarget;
  const issues = batchIssuesFrom(form, context.selected, context.type?.code);
  context.setTouched(new Set(batchFieldNames));
  context.setIssues(issues);
  const parsed = CreateBatchRequestSchema.safeParse(
    requestFrom(new FormData(form), context.selected),
  );
  if (!parsed.success || Object.keys(issues).length > 0) {
    context.setError('Revise los campos marcados antes de continuar.');
    return;
  }
  await saveBatch(parsed.data, context);
};

const saveBatch = async (
  data: CreateBatchRequestSchemaOutput,
  context: SubmitContext,
): Promise<void> => {
  context.setBusy(true);
  context.setError(undefined);
  try {
    const batch = await createBatch(context.request, data);
    void context.navigate(`/lotes/${batch.id}`, { replace: true });
    context.setIssues({});
    context.setTouched(new Set());
  } catch (cause) {
    context.setError(errorMessage(cause));
  } finally {
    context.setBusy(false);
  }
};

type CreateBatchRequestSchemaOutput = ReturnType<
  typeof CreateBatchRequestSchema.parse
>;

interface ValidationContext extends BatchFormSetters {
  readonly selected: readonly string[];
  readonly types: readonly PiscoTypeItem[];
  readonly typeId: string;
  readonly touched: ReadonlySet<BatchFieldName>;
}

const updateBatchValidation = (
  event: ChangeEvent<HTMLFormElement>,
  context: ValidationContext,
): void => {
  const element = event.target;
  if (!(
    element instanceof HTMLInputElement || element instanceof HTMLSelectElement
  ))
    return;
  const changed = element.dataset.validationField ?? element.name;
  const field = validationField(changed);
  if (!field) return;
  const nextTouched = new Set(context.touched).add(field);
  const nextSelected = selectedAfterChange(element, context.selected);
  const typeId = changed === 'piscoTypeId' ? element.value : context.typeId;
  const typeCode = context.types.find((type) => type.id === typeId)?.code;
  const issues = batchIssuesFrom(event.currentTarget, nextSelected, typeCode);
  context.setTouched(nextTouched);
  context.setIssues(visibleIssues(issues, nextTouched));
  context.setError(undefined);
};

const validationField = (changed: string): BatchFieldName | undefined =>
  changed === 'varietySelection' || changed.startsWith('percentage-')
    ? 'varieties'
    : batchFieldNames.find((name) => name === changed);

const visibleIssues = (
  issues: BatchFieldIssues,
  touched: ReadonlySet<BatchFieldName>,
): BatchFieldIssues =>
  Object.fromEntries(
    Object.entries(issues).filter(([name]) =>
      touched.has(name as BatchFieldName),
    ),
  );

const selectedAfterChange = (
  element: HTMLInputElement | HTMLSelectElement,
  selected: readonly string[],
): readonly string[] => {
  const varietyId = element.dataset.varietyId;
  if (element.name !== 'varietySelection' || !varietyId) return selected;
  return element instanceof HTMLInputElement && element.checked
    ? [...new Set([...selected, varietyId])]
    : selected.filter((id) => id !== varietyId);
};

export const useBatchFormState = (masters: BatchMasters) => {
  const { request } = useAuth();
  const navigate = useNavigate();
  const types = masters.piscoTypes.filter((item) => item.isActive);
  const varieties = masters.varieties.filter((item) => item.isActive);
  const [chosenType, setChosenType] = useState('');
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [issues, setIssues] = useState<BatchFieldIssues>({});
  const [touched, setTouched] = useState<ReadonlySet<BatchFieldName>>(
    new Set(),
  );
  const typeId = chosenType || (types[0]?.id ?? '');
  const setters = { setBusy, setError, setIssues, setTouched, setSelected };
  const handlers = batchFormHandlers({
    request,
    navigate,
    selected,
    types,
    typeId,
    touched,
    ...setters,
  });
  return {
    types,
    varieties,
    typeId,
    selected,
    busy,
    error,
    issues,
    setChosenType,
    ...handlers,
  };
};

const batchFormHandlers = (
  context: ValidationContext & {
    readonly request: AuthorizedRequest;
    readonly navigate: NavigateFunction;
  },
): {
  readonly submit: (event: SyntheticEvent<HTMLFormElement>) => void;
  readonly change: (event: ChangeEvent<HTMLFormElement>) => void;
  readonly toggle: (id: string) => void;
} => {
  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    void submitBatch(event, {
      ...context,
      type: context.types.find((item) => item.id === context.typeId),
    });
  };
  const change = (event: ChangeEvent<HTMLFormElement>) => {
    updateBatchValidation(event, context);
  };
  const toggle = (id: string) => {
    context.setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };
  return { submit, change, toggle };
};
