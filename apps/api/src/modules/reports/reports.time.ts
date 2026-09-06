const LIMA_OFFSET = '-05:00';
export const REPORT_TIME_ZONE = 'America/Lima' as const;

const nextDate = (value: string): string => {
  const date = new Date(`${value}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
};

export const reportRange = (
  dateFrom: string,
  dateTo: string,
  now: Date,
): Pick<ReportRange, 'from' | 'toExclusive' | 'now'> => ({
  from: new Date(`${dateFrom}T00:00:00${LIMA_OFFSET}`),
  toExclusive: new Date(`${nextDate(dateTo)}T00:00:00${LIMA_OFFSET}`),
  now,
});

export const limaMonth = (value: Date): string => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: REPORT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(value);
  const year = parts.find((part) => part.type === 'year')?.value ?? '';
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  return `${year}-${month}`;
};
import type { ReportRange } from './reports.types.js';
