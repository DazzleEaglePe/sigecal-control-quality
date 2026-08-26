const TIME_ZONE = 'America/Lima';
const LIMA_OFFSET = '-05:00';

export const inspectionYear = (value: Date): string =>
  new Intl.DateTimeFormat('en', {
    timeZone: TIME_ZONE,
    year: 'numeric',
  }).format(value);

export const scheduledFromTemplate = (
  batchStart: Date,
  offsetDays: number,
  localTime: Date,
): Date => {
  const day = new Date(batchStart);
  day.setUTCDate(day.getUTCDate() + offsetDays);
  const date = day.toISOString().slice(0, 10);
  const time = localTime.toISOString().slice(11, 19);
  return new Date(`${date}T${time}${LIMA_OFFSET}`);
};
