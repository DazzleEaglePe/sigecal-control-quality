import type { InspectionItem } from '@sigecal/shared';

export const inspectionStatusLabel: Readonly<
  Record<InspectionItem['status'], string>
> = {
  PROGRAMADA: 'Programada',
  EN_PROCESO: 'En proceso',
  COMPLETADA: 'Completada',
  VENCIDA: 'Vencida',
  CANCELADA: 'Cancelada',
  REPROGRAMADA: 'Reprogramada',
};

export const inspectionTypeLabel: Readonly<
  Record<InspectionItem['type'], string>
> = {
  FISICOQUIMICO: 'Fisicoquímico',
  ORGANOLEPTICO: 'Organoléptico',
};

export const limaDateTime = (value: string): string =>
  new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Lima',
  }).format(new Date(value));

export const limaDateKey = (value: string): string =>
  new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Lima',
  }).format(new Date(value));

export const statusClass = (status: InspectionItem['status']): string =>
  `quality-status status-${status.toLowerCase()}`;
