import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type {
  SensoryPanelistOption,
  SensoryPreparation,
  SensoryProfile,
  SensorySessionItem,
} from '@sigecal/shared';
import type { AuthorizedRequest } from '../auth/auth-context.js';
import {
  correctSensorySession,
  getSensoryPreparation,
  getSensoryProfile,
  getSensorySession,
  listPanelistOptions,
} from './sensory-api.js';
import type { SensoryFormValue } from './SensoryForm.js';

const correctionInput = (value: SensoryFormValue) => ({
  reason: value.reason ?? '',
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

export const useSensorySessionRecord = (
  request: AuthorizedRequest,
  id: string,
) => {
  const [session, setSession] = useState<SensorySessionItem>();
  const [profile, setProfile] = useState<SensoryProfile>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    void Promise.all([
      getSensorySession(request, id),
      getSensoryProfile(request, id),
    ])
      .then(([item, itemProfile]) => {
        setSession(item);
        setProfile(itemProfile);
      })
      .catch((cause: unknown) => {
        setError(
          cause instanceof Error
            ? cause.message
            : 'No fue posible cargar la sesión.',
        );
      });
  }, [id, request]);
  return { session, setSession, profile, setProfile, error, setError };
};
type RecordState = ReturnType<typeof useSensorySessionRecord>;

const useCorrectionContext = (
  request: AuthorizedRequest,
  record: RecordState,
) => {
  const [preparation, setPreparation] = useState<SensoryPreparation>();
  const [options, setOptions] = useState<readonly SensoryPanelistOption[]>([]);
  const [correcting, setCorrecting] = useState(false);
  const open = async () => {
    if (!record.session) return;
    try {
      const [context, people] = await Promise.all([
        getSensoryPreparation(request, record.session.inspection.id),
        listPanelistOptions(request),
      ]);
      setPreparation(context);
      setOptions(people);
      setCorrecting(true);
    } catch (cause) {
      record.setError(
        cause instanceof Error
          ? cause.message
          : 'No fue posible preparar la corrección.',
      );
    }
  };
  return { preparation, options, correcting, setCorrecting, open };
};
const useCorrectionSave = (
  request: AuthorizedRequest,
  record: RecordState,
  close: () => void,
) => {
  const [saving, setSaving] = useState(false);
  const submit = async (value: SensoryFormValue) => {
    if (!record.session) return;
    try {
      setSaving(true);
      const result = await correctSensorySession(
        request,
        record.session.id,
        correctionInput(value),
      );
      toast.success('Se creó una versión corregida.');
      record.setSession(result.replacement);
      record.setProfile(
        await getSensoryProfile(request, result.replacement.id),
      );
      close();
    } catch (cause) {
      record.setError(
        cause instanceof Error
          ? cause.message
          : 'No fue posible corregir la sesión.',
      );
    } finally {
      setSaving(false);
    }
  };
  return { saving, submit };
};

export const useSensoryCorrection = (
  request: AuthorizedRequest,
  record: RecordState,
) => {
  const context = useCorrectionContext(request, record);
  const save = useCorrectionSave(request, record, () => {
    context.setCorrecting(false);
  });
  return { ...context, ...save };
};
