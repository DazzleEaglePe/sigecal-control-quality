import ExcelJS from '@excel.js/exceljs';
import { describe, expect, it } from 'vitest';

import {
  renderInspectionsExcel,
  renderNonConformitiesExcel,
  renderResultsExcel,
} from './reports.excel.js';
import type {
  InspectionExportRow,
  NonConformityExportRow,
  ReportGenerator,
  ResultExportRow,
} from './reports.types.js';

const context = {
  generatedBy: {
    fullName: 'Nicolle Prueba',
    email: 'nicolle@sigecal.demo',
  } satisfies ReportGenerator,
  emittedAt: new Date('2026-09-20T17:00:00.000Z'),
  filters: { includeDemo: false, status: 'COMPLETADA' },
};
const inspections: readonly InspectionExportRow[] = [
  {
    code: 'INS-2026-0001',
    batchCode: 'LT-2026-0001',
    stageName: 'Fermentación',
    type: 'FISICOQUIMICO',
    status: 'COMPLETADA',
    scheduledDate: new Date('2026-09-18T15:00:00.000Z'),
    executedAt: new Date('2026-09-18T14:30:00.000Z'),
    responsible: 'Analista Prueba',
    equipment: 'EQ-001',
    dataOrigin: 'REAL',
  },
];
const nonConformities: readonly NonConformityExportRow[] = [
  {
    code: 'NC-2026-0001',
    batchCode: 'LT-2026-0001',
    stageName: 'Fermentación',
    origin: 'MANUAL',
    severity: 'MODERADA',
    status: 'EN_TRATAMIENTO',
    description: 'Desviación controlada.',
    rootCause: null,
    detectedAt: new Date('2026-09-18T15:00:00.000Z'),
    assignedTo: 'Jefe Prueba',
    assignedArea: 'Calidad',
    attentionStartedAt: new Date('2026-09-18T16:00:00.000Z'),
    closedAt: null,
    dataOrigin: 'REAL',
    actions: [
      {
        type: 'CORRECTIVA',
        description: 'Ajustar procedimiento.',
        responsible: 'Jefe Prueba',
        committedDate: new Date('2026-09-22T05:00:00.000Z'),
        executedAt: null,
        status: 'PENDIENTE',
        isEffective: null,
        verifiedBy: null,
        verifiedAt: null,
      },
    ],
  },
];
const results: readonly ResultExportRow[] = [
  {
    inspectionCode: 'INS-2026-0001',
    batchCode: 'LT-2026-0001',
    stageName: 'Destilación',
    parameterCode: 'ALCOHOL',
    parameterName: 'Grado alcohólico',
    unit: '% vol.',
    value: 42.5,
    status: 'CONFORME',
    standardReference: 'NTP 211.001',
    recordedAt: new Date('2026-09-18T18:00:00.000Z'),
    recordedBy: 'Analista Prueba',
    equipmentCode: 'ALC-001',
    observation: null,
    dataOrigin: 'REAL',
  },
];

const workbookFrom = async (content: Buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(
    content as unknown as Parameters<typeof workbook.xlsx.load>[0],
  );
  return workbook;
};

describe('exportaciones Excel', () => {
  it('crea inspecciones con datos tipados y filtros visibles', async () => {
    const content = await renderInspectionsExcel({
      ...context,
      rows: inspections,
    });
    const workbook = await workbookFrom(content);
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      'Inspecciones',
      'Filtros',
    ]);
    expect(workbook.getWorksheet('Inspecciones')?.getCell('A6').value).toBe(
      'INS-2026-0001',
    );
    expect(
      workbook.getWorksheet('Inspecciones')?.getCell('F6').value,
    ).toBeInstanceOf(Date);
    expect(workbook.getWorksheet('Filtros')?.getCell('B4').value).toBe('No');
  });

  it('separa las no conformidades de sus acciones', async () => {
    const content = await renderNonConformitiesExcel({
      ...context,
      rows: nonConformities,
    });
    const workbook = await workbookFrom(content);
    expect(
      workbook.getWorksheet('Acciones correctivas')?.getCell('A6').value,
    ).toBe('NC-2026-0001');
  });

  it('conserva los resultados como valores numéricos', async () => {
    const content = await renderResultsExcel({
      ...context,
      rows: results,
    });
    const workbook = await workbookFrom(content);
    expect(workbook.getWorksheet('Resultados')?.getCell('G6').value).toBe(42.5);
  });
});
