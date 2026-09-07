import type { AuthorizedBlobRequest } from '../auth/auth-context.js';
import type {
  InspectionExportQuery,
  NonConformityExportQuery,
  ResultExportQuery,
} from '@sigecal/shared';

const saveBlob = (content: Blob, fileName: string): void => {
  const url = URL.createObjectURL(content);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const downloadTraceabilityPdf = async (
  request: AuthorizedBlobRequest,
  batchId: string,
  batchCode: string,
): Promise<void> => {
  const content = await request(
    `/reports/traceability/${batchId}/pdf`,
    'application/pdf',
  );
  saveBlob(content, `trazabilidad-${batchCode}.pdf`);
};

export type ExcelReport = 'inspections' | 'nonconformities' | 'results';
export type ExcelReportQuery =
  InspectionExportQuery | NonConformityExportQuery | ResultExportQuery;

const queryString = (query: ExcelReportQuery): string => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  return params.toString();
};

const excelFileName = (report: ExcelReport): string => {
  const prefix: Record<ExcelReport, string> = {
    inspections: 'inspecciones',
    nonconformities: 'no-conformidades',
    results: 'resultados',
  };
  return `${prefix[report]}-${new Date().toISOString().slice(0, 10)}.xlsx`;
};

export const downloadExcelReport = async (
  request: AuthorizedBlobRequest,
  report: ExcelReport,
  query: ExcelReportQuery,
): Promise<void> => {
  const serialized = queryString(query);
  const content = await request(
    `/reports/${report}/excel${serialized ? `?${serialized}` : ''}`,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  saveBlob(content, excelFileName(report));
};
