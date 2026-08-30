interface StandardRange {
  readonly minValue: string | null;
  readonly maxValue: string | null;
}

export const formatStandardRange = (standard: StandardRange): string => {
  if (standard.minValue !== null && standard.maxValue !== null)
    return `${standard.minValue} — ${standard.maxValue}`;
  if (standard.minValue !== null) return `Desde ${standard.minValue}`;
  if (standard.maxValue !== null) return `Hasta ${standard.maxValue}`;
  return 'Sin límites configurados';
};
