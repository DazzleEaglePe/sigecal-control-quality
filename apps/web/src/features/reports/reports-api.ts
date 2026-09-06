import type { AuthorizedBlobRequest } from '../auth/auth-context.js';

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
