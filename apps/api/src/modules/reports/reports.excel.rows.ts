import type { SheetDefinition } from './reports.excel.js';
import type {
  CorrectiveActionExportRow,
  InspectionExportRow,
  NonConformityExportRow,
  ResultExportRow,
} from './reports.types.js';

const humanize = (value: string): string =>
  value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^./, (letter) => letter.toUpperCase());

export const inspectionSheet = (
  rows: readonly InspectionExportRow[],
): SheetDefinition => ({
  name: 'Inspecciones',
  headers: [
    'Código',
    'Lote',
    'Etapa',
    'Tipo',
    'Estado',
    'Programada',
    'Ejecutada',
    'Responsable',
    'Equipo',
    'Origen',
  ],
  rows: rows.map((row) => [
    row.code,
    row.batchCode,
    row.stageName,
    humanize(row.type),
    humanize(row.status),
    row.scheduledDate,
    row.executedAt,
    row.responsible,
    row.equipment,
    row.dataOrigin,
  ]),
  dateColumns: [6, 7],
});

const actionRow = (
  code: string,
  batchCode: string,
  action: CorrectiveActionExportRow,
) =>
  [
    code,
    batchCode,
    humanize(action.type),
    action.description,
    action.responsible,
    action.committedDate,
    action.executedAt,
    humanize(action.status),
    action.isEffective === null ? null : action.isEffective ? 'Sí' : 'No',
    action.verifiedBy,
    action.verifiedAt,
  ] as const;

const actionSheet = (
  rows: readonly NonConformityExportRow[],
): SheetDefinition => ({
  name: 'Acciones correctivas',
  headers: [
    'No conformidad',
    'Lote',
    'Tipo',
    'Descripción',
    'Responsable',
    'Compromiso',
    'Ejecución',
    'Estado',
    'Eficaz',
    'Verificado por',
    'Verificación',
  ],
  rows: rows.flatMap((row) =>
    row.actions.map((action) => actionRow(row.code, row.batchCode, action)),
  ),
  dateColumns: [6, 7, 11],
});

const nonConformitySheet = (
  rows: readonly NonConformityExportRow[],
): SheetDefinition => ({
  name: 'No conformidades',
  headers: [
    'Código',
    'Lote',
    'Etapa',
    'Origen',
    'Severidad',
    'Estado',
    'Descripción',
    'Causa raíz',
    'Detectada',
    'Asignado a',
    'Área',
    'Inicio atención',
    'Cierre',
    'Origen de datos',
  ],
  rows: rows.map((row) => [
    row.code,
    row.batchCode,
    row.stageName,
    humanize(row.origin),
    humanize(row.severity),
    humanize(row.status),
    row.description,
    row.rootCause,
    row.detectedAt,
    row.assignedTo,
    row.assignedArea,
    row.attentionStartedAt,
    row.closedAt,
    row.dataOrigin,
  ]),
  dateColumns: [9, 12, 13],
});

export const nonConformitySheets = (
  rows: readonly NonConformityExportRow[],
): readonly SheetDefinition[] => [nonConformitySheet(rows), actionSheet(rows)];

export const resultSheet = (
  rows: readonly ResultExportRow[],
): SheetDefinition => ({
  name: 'Resultados',
  headers: [
    'Inspección',
    'Lote',
    'Etapa',
    'Parámetro',
    'Nombre',
    'Unidad',
    'Valor',
    'Estado',
    'Estándar',
    'Registrado',
    'Registrado por',
    'Equipo',
    'Observación',
    'Origen',
  ],
  rows: rows.map((row) => [
    row.inspectionCode,
    row.batchCode,
    row.stageName,
    row.parameterCode,
    row.parameterName,
    row.unit,
    row.value,
    humanize(row.status),
    row.standardReference,
    row.recordedAt,
    row.recordedBy,
    row.equipmentCode,
    row.observation,
    row.dataOrigin,
  ]),
  dateColumns: [10],
  decimalColumns: [7],
});
