import type { CorrectiveActionItem } from '@sigecal/shared';

export const actionTypeLabel: Readonly<
  Record<CorrectiveActionItem['type'], string>
> = {
  CORRECCION: 'Corrección',
  CORRECTIVA: 'Correctiva',
  PREVENTIVA: 'Preventiva',
};

export const actionStatusLabel: Readonly<
  Record<CorrectiveActionItem['status'], string>
> = {
  PENDIENTE: 'Pendiente',
  EN_EJECUCION: 'En ejecución',
  EJECUTADA: 'Ejecutada',
  VERIFICADA: 'Verificada',
  NO_EFICAZ: 'No eficaz',
};
