import { useState } from 'react';
import { Download, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { BatchItem } from '@sigecal/shared';

import { Button } from '../../components/ui/button.js';
import { useAuth } from '../auth/useAuth.js';
import { downloadTraceabilityPdf } from './reports-api.js';

export const TraceabilityDownloadButton = ({
  batch,
}: {
  readonly batch: BatchItem;
}): React.JSX.Element => {
  const { requestBlob } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const download = async (): Promise<void> => {
    setDownloading(true);
    try {
      await downloadTraceabilityPdf(requestBlob, batch.id, batch.code);
      toast.success('Reporte de trazabilidad descargado');
    } catch (error) {
      toast.error('No se pudo generar el reporte', {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setDownloading(false);
    }
  };
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        void download();
      }}
      disabled={downloading}
    >
      {downloading ? <LoaderCircle className="animate-spin" /> : <Download />}
      Descargar PDF
    </Button>
  );
};
