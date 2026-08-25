import type {
  BatchStatus,
  DataOrigin,
  InspectionStatus,
  InspectionType,
  NCSeverity,
  NCStatus,
} from '@sigecal/shared';

export const batchStatusLabel: Readonly<Record<BatchStatus, string>> = {
  EN_PROCESO: 'En proceso',
  EN_OBSERVACION: 'En observación',
  CERRADO: 'Cerrado',
  RECHAZADO: 'Rechazado',
};
export const originLabel: Readonly<Record<DataOrigin, string>> = {
  REAL: 'Real',
  DEMO: 'Demostración',
};
export const inspectionTypeLabel: Readonly<Record<InspectionType, string>> = {
  FISICOQUIMICO: 'Fisicoquímico',
  ORGANOLEPTICO: 'Organoléptico',
};
export const inspectionStatusLabel: Readonly<Record<InspectionStatus, string>> =
  {
    PROGRAMADA: 'Programada',
    EN_PROCESO: 'En proceso',
    COMPLETADA: 'Completada',
    VENCIDA: 'Vencida',
    CANCELADA: 'Cancelada',
    REPROGRAMADA: 'Reprogramada',
  };
export const ncStatusLabel: Readonly<Record<NCStatus, string>> = {
  ABIERTA: 'Abierta',
  EN_ANALISIS: 'En análisis',
  EN_TRATAMIENTO: 'En tratamiento',
  EN_VERIFICACION: 'En verificación',
  CERRADA: 'Cerrada',
  ANULADA: 'Anulada',
};
export const severityLabel: Readonly<Record<NCSeverity, string>> = {
  LEVE: 'Leve',
  MODERADA: 'Moderada',
  CRITICA: 'Crítica',
};

export const localDate = (value: string): string =>
  new Intl.DateTimeFormat('es-PE', { timeZone: 'UTC' }).format(
    new Date(`${value}T00:00:00.000Z`),
  );
export const localDateTime = (value: string): string =>
  new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Lima',
  }).format(new Date(value));
