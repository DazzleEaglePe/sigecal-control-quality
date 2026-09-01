import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import type {
  InspectionItem,
  SensoryPanelistOption,
  SensoryPreparation,
} from '@sigecal/shared';
import type { AuthorizedRequest } from '../auth/auth-context.js';
import { listInspections } from '../inspections/inspections-api.js';
import {
  createSensorySession,
  getSensoryPreparation,
  listPanelistOptions,
} from './sensory-api.js';
import type { SensoryFormValue } from './SensoryForm.js';

const toInput = (inspectionId: string, value: SensoryFormValue) => ({
  inspectionId,
  sessionDate: value.sessionDate,
  panelists: value.panelists.map((panelist) => ({
    ...(panelist.kind === 'user'
      ? { userId: panelist.identity }
      : { externalName: panelist.identity }),
    scores: Object.entries(panelist.scores).map(([attributeId, score]) => ({
      attributeId,
      score,
      descriptor: panelist.descriptors[attributeId]?.trim()
        ? panelist.descriptors[attributeId]
        : null,
    })),
  })),
  defectsFound: value.defectsFound.trim() ? value.defectsFound : null,
  notes: value.notes.trim() ? value.notes : null,
});
const loadOptions = (request: AuthorizedRequest) =>
  Promise.all([
    listInspections(request, {
      page: 1,
      pageSize: 50,
      type: 'ORGANOLEPTICO',
      status: 'EN_PROCESO',
    }),
    listPanelistOptions(request),
  ]);

const useSessionOptions = (
  request: AuthorizedRequest,
  report: (message: string) => void,
) => {
  const [inspections, setInspections] = useState<readonly InspectionItem[]>([]);
  const [options, setOptions] = useState<readonly SensoryPanelistOption[]>([]);
  useEffect(() => {
    void loadOptions(request)
      .then(([result, people]) => {
        setInspections(result.data);
        setOptions(people);
      })
      .catch((cause: unknown) => {
        report(
          cause instanceof Error
            ? cause.message
            : 'No fue posible preparar el formulario.',
        );
      });
  }, [request, report]);
  return { inspections, options };
};
const usePreparation = (
  request: AuthorizedRequest,
  inspectionId: string,
  report: (message: string) => void,
) => {
  const [preparation, setPreparation] = useState<SensoryPreparation | null>(
    null,
  );
  useEffect(() => {
    if (inspectionId)
      void getSensoryPreparation(request, inspectionId)
        .then(setPreparation)
        .catch((cause: unknown) => {
          report(
            cause instanceof Error
              ? cause.message
              : 'No existe un umbral aplicable.',
          );
        });
  }, [inspectionId, request, report]);
  return { preparation, setPreparation };
};
const useSaveSession = (
  request: AuthorizedRequest,
  inspectionId: string,
  report: (message: string) => void,
) => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const submit = async (value: SensoryFormValue) => {
    try {
      setSaving(true);
      const session = await createSensorySession(
        request,
        toInput(inspectionId, value),
      );
      toast.success('Sesión organoléptica registrada.');
      void navigate(`/organoleptico/${session.id}`);
    } catch (cause) {
      report(
        cause instanceof Error
          ? cause.message
          : 'No fue posible guardar la sesión.',
      );
    } finally {
      setSaving(false);
    }
  };
  return { saving, submit };
};

export const useNewSensorySession = (request: AuthorizedRequest) => {
  const [search] = useSearchParams();
  const [inspectionId, setInspectionId] = useState(
    search.get('inspectionId') ?? '',
  );
  const [error, setError] = useState<string>();
  const report = useCallback((message: string) => {
    setError(message);
  }, []);
  const data = useSessionOptions(request, report);
  const context = usePreparation(request, inspectionId, report);
  const save = useSaveSession(request, inspectionId, report);
  const selectInspection = (id: string) => {
    setError(undefined);
    context.setPreparation(null);
    setInspectionId(id);
  };
  return {
    inspectionId,
    ...data,
    ...context,
    ...save,
    error,
    selectInspection,
  };
};
