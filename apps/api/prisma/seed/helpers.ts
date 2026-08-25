import { createHash } from 'node:crypto';

export const seedId = (key: string): string => {
  const hex = createHash('sha256').update(`sigecal:${key}`).digest('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `5${hex.slice(13, 16)}`,
    `a${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join('-');
};

export const dateOnly = (value: string): Date =>
  new Date(`${value}T00:00:00.000Z`);

export const dateTime = (value: string): Date => new Date(value);

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};
