import { z } from 'zod';

export const RoleSchema = z.enum([
  'ADMIN',
  'JEFE_CALIDAD',
  'ANALISTA',
  'OPERARIO',
]);
export type Role = z.infer<typeof RoleSchema>;
export const Role = RoleSchema.enum;

export const BatchStatusSchema = z.enum([
  'EN_PROCESO',
  'EN_OBSERVACION',
  'CERRADO',
  'RECHAZADO',
]);
export type BatchStatus = z.infer<typeof BatchStatusSchema>;
export const BatchStatus = BatchStatusSchema.enum;

export const InspectionTypeSchema = z.enum(['FISICOQUIMICO', 'ORGANOLEPTICO']);
export type InspectionType = z.infer<typeof InspectionTypeSchema>;
export const InspectionType = InspectionTypeSchema.enum;

export const InspectionStatusSchema = z.enum([
  'PROGRAMADA',
  'EN_PROCESO',
  'COMPLETADA',
  'VENCIDA',
  'CANCELADA',
  'REPROGRAMADA',
]);
export type InspectionStatus = z.infer<typeof InspectionStatusSchema>;
export const InspectionStatus = InspectionStatusSchema.enum;

export const ParameterTypeSchema = z.enum(['FISICOQUIMICO', 'SENSORIAL']);
export type ParameterType = z.infer<typeof ParameterTypeSchema>;
export const ParameterType = ParameterTypeSchema.enum;

export const ResultStatusSchema = z.enum([
  'CONFORME',
  'NO_CONFORME',
  'ANULADO',
]);
export type ResultStatus = z.infer<typeof ResultStatusSchema>;
export const ResultStatus = ResultStatusSchema.enum;

export const NCStatusSchema = z.enum([
  'ABIERTA',
  'EN_ANALISIS',
  'EN_TRATAMIENTO',
  'EN_VERIFICACION',
  'CERRADA',
  'ANULADA',
]);
export type NCStatus = z.infer<typeof NCStatusSchema>;
export const NCStatus = NCStatusSchema.enum;

export const NCSeveritySchema = z.enum(['LEVE', 'MODERADA', 'CRITICA']);
export type NCSeverity = z.infer<typeof NCSeveritySchema>;
export const NCSeverity = NCSeveritySchema.enum;

export const NCOriginSchema = z.enum([
  'AUTOMATICA_FISICOQUIMICA',
  'AUTOMATICA_SENSORIAL',
  'MANUAL',
]);
export type NCOrigin = z.infer<typeof NCOriginSchema>;
export const NCOrigin = NCOriginSchema.enum;

export const ActionTypeSchema = z.enum([
  'CORRECCION',
  'CORRECTIVA',
  'PREVENTIVA',
]);
export type ActionType = z.infer<typeof ActionTypeSchema>;
export const ActionType = ActionTypeSchema.enum;

export const ActionStatusSchema = z.enum([
  'PENDIENTE',
  'EN_EJECUCION',
  'EJECUTADA',
  'VERIFICADA',
  'NO_EFICAZ',
]);
export type ActionStatus = z.infer<typeof ActionStatusSchema>;
export const ActionStatus = ActionStatusSchema.enum;

export const AuditActionSchema = z.enum([
  'CREATE',
  'UPDATE',
  'STATE_CHANGE',
  'LOGIN',
  'LOGOUT',
  'EXPORT',
]);
export type AuditAction = z.infer<typeof AuditActionSchema>;
export const AuditAction = AuditActionSchema.enum;

export const EquipmentStatusSchema = z.enum([
  'OPERATIVO',
  'EN_MANTENIMIENTO',
  'FUERA_DE_SERVICIO',
]);
export type EquipmentStatus = z.infer<typeof EquipmentStatusSchema>;
export const EquipmentStatus = EquipmentStatusSchema.enum;

export const DataOriginSchema = z.enum(['REAL', 'DEMO']);
export type DataOrigin = z.infer<typeof DataOriginSchema>;
export const DataOrigin = DataOriginSchema.enum;
