import type ExcelJS from '@excel.js/exceljs';
import type { Worksheet } from '@excel.js/exceljs';

import type {
  InspectionExportRow,
  NonConformityExportRow,
  ReportGenerator,
  ReportWorkbookInput,
  ResultExportRow,
} from './reports.types.js';
import {
  inspectionSheet,
  nonConformitySheets,
  resultSheet,
} from './reports.excel.rows.js';

type CellValue = string | number | boolean | Date | null;
export interface SheetDefinition {
  readonly name: string;
  readonly headers: readonly string[];
  readonly rows: readonly (readonly CellValue[])[];
  readonly dateColumns?: readonly number[];
  readonly decimalColumns?: readonly number[];
}
interface WorkbookContext {
  readonly generatedBy: ReportGenerator;
  readonly emittedAt: Date;
  readonly filters: Record<string, unknown>;
}

const DARK = '17201C';
const recordFrom = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const createWorkbook = async (): Promise<ExcelJS.Workbook> => {
  // El paquete publica el constructor en este subpath, pero omite su declaración.
  // @ts-expect-error La instancia se valida por su contrato antes de utilizarla.
  const imported: unknown = await import('@excel.js/exceljs/workbook');
  const module = recordFrom(imported);
  const defaultExport = recordFrom(module.default);
  const nestedDefault = recordFrom(defaultExport.default);
  const candidates = [
    module.default,
    module.Workbook,
    defaultExport.default,
    defaultExport.Workbook,
    nestedDefault.Workbook,
  ];
  for (const candidate of candidates) {
    if (typeof candidate !== 'function') continue;
    const workbook = new (candidate as typeof ExcelJS.Workbook)();
    if (typeof workbook.addWorksheet === 'function') return workbook;
  }
  throw new Error('No se pudo inicializar el generador Excel.');
};

const filterValue = (value: unknown): CellValue => {
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'number' || typeof value === 'string') return value;
  return value === null || value === undefined
    ? 'No aplicado'
    : 'Valor complejo';
};

const cellText = (value: unknown): string => {
  if (value instanceof Date) return '2026-09-06 15:30';
  if (typeof value === 'string' || typeof value === 'number')
    return String(value);
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  return '';
};

const styleHeader = (sheet: Worksheet, rowNumber: number): void => {
  const row = sheet.getRow(rowNumber);
  row.height = 24;
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK } };
    cell.font = {
      name: 'Arial',
      size: 10,
      bold: true,
      color: { argb: 'FFFFFF' },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFFFFF' } } };
  });
};

const fitColumns = (sheet: Worksheet): void => {
  sheet.columns.forEach((column) => {
    let width = 12;
    column.eachCell?.({ includeEmpty: false }, (cell) => {
      const text = cellText(cell.value);
      width = Math.max(width, Math.min(text.length + 2, 42));
    });
    column.width = width;
  });
};

const addSheetHeading = (
  sheet: Worksheet,
  definition: SheetDefinition,
  context: WorkbookContext,
): void => {
  sheet.getCell('A1').value = definition.name;
  sheet.getCell('A1').font = {
    name: 'Arial',
    size: 16,
    bold: true,
    color: { argb: DARK },
  };
  sheet.getCell('A2').value =
    `SIGECAL · ${String(definition.rows.length)} registro(s)`;
  sheet.getCell('A2').font = {
    name: 'Arial',
    size: 10,
    italic: true,
    color: { argb: '52605A' },
  };
  sheet.getCell('A3').value =
    `Generado por ${context.generatedBy.fullName} el ${context.emittedAt.toISOString()}`;
  sheet.getCell('A3').font = {
    name: 'Arial',
    size: 9,
    color: { argb: '52605A' },
  };
  sheet.addRow([]);
  sheet.addRow([...definition.headers]);
};

const formatColumns = (sheet: Worksheet, definition: SheetDefinition): void => {
  definition.dateColumns?.forEach((index) => {
    sheet.getColumn(index).numFmt = 'yyyy-mm-dd hh:mm';
  });
  definition.decimalColumns?.forEach((index) => {
    sheet.getColumn(index).numFmt = '#,##0.000000';
  });
};

const addDataSheet = (
  workbook: ExcelJS.Workbook,
  definition: SheetDefinition,
  context: WorkbookContext,
): void => {
  const sheet = workbook.addWorksheet(definition.name, {
    views: [{ state: 'frozen', ySplit: 5 }],
    properties: { defaultRowHeight: 18 },
  });
  addSheetHeading(sheet, definition, context);
  definition.rows.forEach((row) => sheet.addRow([...row]));
  styleHeader(sheet, 5);
  sheet.autoFilter = {
    from: { row: 5, column: 1 },
    to: { row: 5, column: definition.headers.length },
  };
  formatColumns(sheet, definition);
  fitColumns(sheet);
};

const addFiltersSheet = (
  workbook: ExcelJS.Workbook,
  context: WorkbookContext,
): void => {
  const sheet = workbook.addWorksheet('Filtros');
  sheet.getCell('A1').value = 'Filtros aplicados';
  sheet.getCell('A1').font = {
    name: 'Arial',
    size: 16,
    bold: true,
    color: { argb: DARK },
  };
  sheet.addRow([]);
  sheet.addRow(['Filtro', 'Valor']);
  Object.entries(context.filters).forEach(([key, value]) => {
    sheet.addRow([key, filterValue(value)]);
  });
  styleHeader(sheet, 3);
  sheet.getColumn(1).width = 26;
  sheet.getColumn(2).width = 42;
  sheet.getCell(`A${String(sheet.rowCount + 2)}`).value =
    'Los datos DEMO se excluyen salvo selección explícita autorizada.';
  sheet.getCell(`A${String(sheet.rowCount)}`).font = {
    name: 'Arial',
    size: 9,
    italic: true,
    color: { argb: '52605A' },
  };
};

const renderWorkbook = async (
  definitions: readonly SheetDefinition[],
  context: WorkbookContext,
): Promise<Buffer> => {
  const workbook = await createWorkbook();
  workbook.creator = 'SIGECAL';
  workbook.created = context.emittedAt;
  definitions.forEach((definition) => {
    addDataSheet(workbook, definition, context);
  });
  addFiltersSheet(workbook, context);
  const content = await workbook.xlsx.writeBuffer();
  return Buffer.from(content);
};

export const renderInspectionsExcel = (
  input: ReportWorkbookInput<InspectionExportRow>,
): Promise<Buffer> => renderWorkbook([inspectionSheet(input.rows)], input);

export const renderNonConformitiesExcel = (
  input: ReportWorkbookInput<NonConformityExportRow>,
): Promise<Buffer> => renderWorkbook(nonConformitySheets(input.rows), input);

export const renderResultsExcel = (
  input: ReportWorkbookInput<ResultExportRow>,
): Promise<Buffer> => renderWorkbook([resultSheet(input.rows)], input);
