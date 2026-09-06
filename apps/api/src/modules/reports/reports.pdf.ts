import PDFDocument from 'pdfkit';
import type { BatchItem, BatchTimelineEntry } from '@sigecal/shared';

import type { ReportGenerator } from './reports.types.js';

export interface TraceabilityPdfInput {
  readonly batch: BatchItem;
  readonly emittedAt: Date;
  readonly generatedBy: ReportGenerator;
  readonly timeline: readonly BatchTimelineEntry[];
}

const COLORS = {
  accent: '#16a36a',
  ink: '#17211b',
  muted: '#5f6b64',
  rule: '#dce5df',
} as const;

const collect = (document: PDFKit.PDFDocument): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    document.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    document.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    document.on('error', reject);
  });

const textDate = (value: string | null): string =>
  value
    ? new Intl.DateTimeFormat('es-PE', {
        dateStyle: 'medium',
        timeZone: /^\d{4}-\d{2}-\d{2}$/.test(value) ? 'UTC' : 'America/Lima',
      }).format(new Date(value))
    : '—';

const stageState: Readonly<Record<BatchTimelineEntry['state'], string>> = {
  COMPLETED: 'Completada',
  CURRENT: 'Actual',
  PENDING: 'Pendiente',
};

const header = (
  document: PDFKit.PDFDocument,
  input: TraceabilityPdfInput,
): void => {
  document
    .fillColor(COLORS.accent)
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('VIÑA TACAMA S.A. · SIGECAL');
  document
    .fillColor(COLORS.ink)
    .fontSize(24)
    .text('Reporte de trazabilidad del lote', { paragraphGap: 4 });
  document
    .font('Helvetica')
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text(`Emitido: ${textDate(input.emittedAt.toISOString())}`)
    .text(
      `Generado por: ${input.generatedBy.fullName} · ${input.generatedBy.email}`,
    );
  document
    .moveDown()
    .strokeColor(COLORS.rule)
    .moveTo(50, document.y)
    .lineTo(545, document.y)
    .stroke();
};

const field = (
  document: PDFKit.PDFDocument,
  label: string,
  value: string,
): void => {
  document
    .font('Helvetica-Bold')
    .fillColor(COLORS.muted)
    .text(label, { continued: true });
  document.font('Helvetica').fillColor(COLORS.ink).text(`  ${value}`);
};

const batchSummary = (document: PDFKit.PDFDocument, batch: BatchItem): void => {
  document
    .moveDown()
    .font('Helvetica-Bold')
    .fontSize(15)
    .fillColor(COLORS.ink)
    .text('Identificación');
  document.moveDown(0.4).fontSize(10);
  field(document, 'Código', batch.code);
  field(document, 'Tipo de pisco', batch.piscoType.name);
  field(document, 'Estado', batch.status.replaceAll('_', ' '));
  field(document, 'Etapa actual', batch.currentStage.name);
  field(document, 'Inicio', textDate(batch.startDate));
  field(document, 'Volumen', `${batch.volumeLiters} L`);
  field(document, 'Origen de datos', batch.dataOrigin);
  field(document, 'Origen de cosecha', batch.harvestOrigin ?? 'No registrado');
};

const composition = (document: PDFKit.PDFDocument, batch: BatchItem): void => {
  document.moveDown().font('Helvetica-Bold').fontSize(15).text('Composición');
  document.moveDown(0.4).fontSize(10);
  for (const item of batch.varieties) {
    const percentage = item.percentage ? ` · ${item.percentage}%` : '';
    document.font('Helvetica').text(`• ${item.variety.name}${percentage}`);
  }
};

const timelineEntry = (
  document: PDFKit.PDFDocument,
  item: BatchTimelineEntry,
): void => {
  document
    .moveDown(0.7)
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(COLORS.ink)
    .text(
      `${String(item.stage.sequence).padStart(2, '0')} · ${item.stage.name}`,
    );
  document.font('Helvetica').fontSize(9).fillColor(COLORS.muted);
  document.text(
    `Estado: ${stageState[item.state]} · Inicio: ${textDate(item.startedAt)} · Fin: ${textDate(item.finishedAt)}`,
  );
  if (item.responsible)
    document.text(
      `Responsable: ${item.responsible.firstName} ${item.responsible.lastName}`,
    );
  if (item.observations) document.text(`Observaciones: ${item.observations}`);
  for (const inspection of item.inspections)
    document.text(
      `Inspección ${inspection.code}: ${inspection.type} · ${inspection.status}`,
    );
  for (const finding of item.nonConformities)
    document.text(
      `No conformidad ${finding.code}: ${finding.severity} · ${finding.status}`,
    );
};

const timeline = (
  document: PDFKit.PDFDocument,
  items: readonly BatchTimelineEntry[],
): void => {
  document
    .moveDown()
    .font('Helvetica-Bold')
    .fontSize(15)
    .fillColor(COLORS.ink)
    .text('Trazabilidad por etapas');
  for (const item of items) timelineEntry(document, item);
};

const pageFooters = (document: PDFKit.PDFDocument, batchCode: string): void => {
  const pages = document.bufferedPageRange();
  for (let index = 0; index < pages.count; index += 1) {
    document.switchToPage(pages.start + index);
    document
      .font('Helvetica')
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text(
        `${batchCode} · Página ${String(index + 1)} de ${String(pages.count)}`,
        50,
        document.page.height - 60,
        {
          align: 'center',
          width: document.page.width - 100,
          lineBreak: false,
        },
      );
  }
};

export const renderTraceabilityPdf = async (
  input: TraceabilityPdfInput,
): Promise<Buffer> => {
  const document = new PDFDocument({
    size: 'A4',
    margin: 50,
    bufferPages: true,
    info: { Title: `Trazabilidad ${input.batch.code}` },
  });
  const result = collect(document);
  header(document, input);
  batchSummary(document, input.batch);
  composition(document, input.batch);
  timeline(document, input.timeline);
  pageFooters(document, input.batch.code);
  document.end();
  return result;
};
