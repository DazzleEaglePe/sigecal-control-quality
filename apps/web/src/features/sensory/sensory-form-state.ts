import type {
  SensoryPanelistOption,
  SensoryPreparation,
  SensorySessionItem,
} from '@sigecal/shared';

export interface PanelistDraft {
  readonly key: string;
  readonly kind: 'user' | 'external';
  readonly identity: string;
  readonly scores: Readonly<Record<string, number>>;
  readonly descriptors: Readonly<Record<string, string>>;
}
export const emptyPanelist = (): PanelistDraft => ({
  key: crypto.randomUUID(),
  kind: 'external',
  identity: '',
  scores: {},
  descriptors: {},
});
export const updatePanelist = (
  items: readonly PanelistDraft[],
  key: string,
  patch: Partial<PanelistDraft>,
) => items.map((item) => (item.key === key ? { ...item, ...patch } : item));
export const attributeAverage = (
  panelists: readonly PanelistDraft[],
  id: string,
): number | null => {
  const values = panelists.flatMap(({ scores }) =>
    scores[id] ? [scores[id]] : [],
  );
  return values.length === panelists.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;
};
export const generalAverage = (
  panelists: readonly PanelistDraft[],
  preparation: SensoryPreparation | null,
): number | null => {
  if (!preparation) return null;
  const values = preparation.attributes.flatMap(({ id }) =>
    panelists
      .map(({ scores }) => scores[id])
      .filter((value): value is number => Boolean(value)),
  );
  return values.length === preparation.attributes.length * panelists.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;
};
export const panelistsFromSession = (
  session: SensorySessionItem,
): readonly PanelistDraft[] =>
  session.panelists.map((panelist) => ({
    key: panelist.id,
    kind: panelist.user ? 'user' : 'external',
    identity: panelist.user?.id ?? panelist.externalName ?? '',
    scores: Object.fromEntries(
      panelist.scores.map(({ attribute, score }) => [attribute.id, score]),
    ),
    descriptors: Object.fromEntries(
      panelist.scores.map(({ attribute, descriptor }) => [
        attribute.id,
        descriptor ?? '',
      ]),
    ),
  }));
export const panelistLabel = (option: SensoryPanelistOption) =>
  `${option.firstName} ${option.lastName}`;
