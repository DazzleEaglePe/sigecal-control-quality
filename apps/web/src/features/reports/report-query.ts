import type { ExcelReport, ExcelReportQuery } from './reports-api.js';

const value = (form: FormData, name: string): string | undefined => {
  const current = form.get(name);
  return typeof current === 'string' && current ? current : undefined;
};
const commonQuery = (form: FormData, canIncludeDemo: boolean) => {
  const dateFrom = value(form, 'dateFrom');
  const dateTo = value(form, 'dateTo');
  return {
    dateFrom: dateFrom ? `${dateFrom}T00:00:00-05:00` : undefined,
    dateTo: dateTo ? `${dateTo}T23:59:59-05:00` : undefined,
    batchId: value(form, 'batchId'),
    includeDemo: canIncludeDemo && form.get('includeDemo') === 'on',
  };
};

const inspectionQuery = (form: FormData, canIncludeDemo: boolean) => ({
  ...commonQuery(form, canIncludeDemo),
  stageId: value(form, 'stageId'),
  responsibleId: value(form, 'responsibleId'),
  status: value(form, 'status') as
    | 'PROGRAMADA'
    | 'EN_PROCESO'
    | 'COMPLETADA'
    | 'VENCIDA'
    | 'CANCELADA'
    | 'REPROGRAMADA'
    | undefined,
  type: value(form, 'type') as 'FISICOQUIMICO' | 'ORGANOLEPTICO' | undefined,
});

const nonConformityQuery = (form: FormData, canIncludeDemo: boolean) => ({
  ...commonQuery(form, canIncludeDemo),
  stageId: value(form, 'stageId'),
  assignedToId: value(form, 'assignedToId'),
  assignedAreaId: value(form, 'assignedAreaId'),
  status: value(form, 'status') as
    | 'ABIERTA'
    | 'EN_ANALISIS'
    | 'EN_TRATAMIENTO'
    | 'EN_VERIFICACION'
    | 'CERRADA'
    | 'ANULADA'
    | undefined,
  severity: value(form, 'severity') as
    'LEVE' | 'MODERADA' | 'CRITICA' | undefined,
});

const resultQuery = (form: FormData, canIncludeDemo: boolean) => ({
  ...commonQuery(form, canIncludeDemo),
  parameterId: value(form, 'parameterId'),
  inspectionId: value(form, 'inspectionId'),
  status: value(form, 'status') as
    'CONFORME' | 'NO_CONFORME' | 'ANULADO' | undefined,
});

export const reportQueryFrom = (
  report: ExcelReport,
  form: FormData,
  canIncludeDemo: boolean,
): ExcelReportQuery => {
  if (report === 'inspections') return inspectionQuery(form, canIncludeDemo);
  if (report === 'nonconformities')
    return nonConformityQuery(form, canIncludeDemo);
  return resultQuery(form, canIncludeDemo);
};
