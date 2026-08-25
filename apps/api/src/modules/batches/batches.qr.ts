import QRCode from 'qrcode';

import { env } from '../../config/env.js';

export const traceabilityUrl = (batchId: string): string => {
  const url = new URL(`/lotes/${batchId}`, env.CORS_ORIGIN);
  url.searchParams.set('vista', 'trazabilidad');
  return url.toString();
};

export const createBatchQr = (batchId: string): Promise<string> =>
  QRCode.toString(traceabilityUrl(batchId), {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 2,
    color: { dark: '#173f2a', light: '#ffffff' },
  });
