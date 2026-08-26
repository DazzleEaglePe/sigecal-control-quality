import { Role, type CreateInspectionRequest } from '@sigecal/shared';

import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnprocessableEntityError,
} from '../../errors/app-error.js';
import type {
  InspectionActor,
  InspectionPlanContext,
  InspectionRecord,
  InspectionReferences,
  ReadyInspectionPlanContext,
} from './inspections.types.js';

export const ensureInspectionManager = (actor: InspectionActor): void => {
  if (actor.role !== Role.ADMIN && actor.role !== Role.JEFE_CALIDAD)
    throw new ForbiddenError();
};

export const ensureInspectionStarter = (
  actor: InspectionActor,
  inspection: InspectionRecord,
): void => {
  const allowed: readonly Role[] = [
    Role.ADMIN,
    Role.JEFE_CALIDAD,
    Role.ANALISTA,
  ];
  if (!allowed.includes(actor.role)) throw new ForbiddenError();
  if (actor.role === Role.ANALISTA && inspection.responsibleId !== actor.userId)
    throw new ForbiddenError(
      'Solo puede iniciar las inspecciones que tiene asignadas.',
    );
};

export const ensureMutableBatch: (
  batch: InspectionReferences['batch'],
) => asserts batch is NonNullable<InspectionReferences['batch']> = (batch) => {
  if (!batch) throw new NotFoundError('El lote no existe.');
  if (batch.status === 'CERRADO' || batch.status === 'RECHAZADO')
    throw new ConflictError(
      'No se pueden programar inspecciones en un lote terminal.',
      'BATCH_NOT_MUTABLE',
    );
};

export const ensureInspectionReferences = (
  input: CreateInspectionRequest,
  references: InspectionReferences,
): void => {
  ensureMutableBatch(references.batch);
  if (!references.stage?.isActive)
    throw new NotFoundError('La etapa seleccionada no está activa.');
  if (!references.responsible?.isActive)
    throw new NotFoundError('La persona responsable no está activa.');
  if (input.equipmentId && !references.equipment?.isActive)
    throw new NotFoundError('El equipo seleccionado no está activo.');
  ensureParameters(input, references);
};

const ensureParameters = (
  input: CreateInspectionRequest,
  references: InspectionReferences,
): void => {
  if (
    references.parameters.length !== input.parameterIds.length ||
    references.parameters.some((parameter) => !parameter.isActive)
  )
    throw new NotFoundError('Algún parámetro seleccionado no está activo.');
  const expected =
    input.type === 'FISICOQUIMICO' ? 'FISICOQUIMICO' : 'SENSORIAL';
  if (references.parameters.some((parameter) => parameter.type !== expected))
    throw new ConflictError(
      'El tipo de parámetro no corresponde al tipo de inspección.',
      'PARAMETER_TYPE_MISMATCH',
    );
};

export const ensureProgrammed = (inspection: InspectionRecord): void => {
  if (inspection.status !== 'PROGRAMADA')
    throw new ConflictError(
      'Solo una inspección programada puede editarse.',
      'INSPECTION_NOT_EDITABLE',
    );
};

export const ensureOperationalEquipment = (
  inspection: InspectionRecord,
): void => {
  if (
    inspection.type === 'FISICOQUIMICO' &&
    inspection.equipment?.status !== 'OPERATIVO'
  )
    throw new UnprocessableEntityError(
      'Asigne un equipo operativo antes de iniciar la inspección.',
      'EQUIPMENT_NOT_OPERATIONAL',
    );
};

export const ensureReadyPlan: (
  context: InspectionPlanContext,
  responsibleByRole: Readonly<Partial<Record<string, string>>>,
) => asserts context is ReadyInspectionPlanContext = (
  context,
  responsibleByRole,
) => {
  const { batch, template } = context;
  if (!batch) throw new NotFoundError('El lote no existe.');
  if (!template) throw new NotFoundError('La plantilla no existe.');
  if (batch.status === 'CERRADO' || batch.status === 'RECHAZADO')
    throw new ConflictError(
      'El lote está en un estado terminal.',
      'BATCH_NOT_MUTABLE',
    );
  if (!template.isActive || !templateApplies(template, batch.startDate))
    throw new ConflictError(
      'La plantilla no está vigente para la fecha inicial del lote.',
      'INSPECTION_TEMPLATE_NOT_EFFECTIVE',
    );
  if (template.piscoTypeId !== batch.piscoTypeId)
    throw new ConflictError(
      'La plantilla no corresponde al tipo de pisco del lote.',
      'INSPECTION_TEMPLATE_PISCO_MISMATCH',
    );
  for (const role of new Set(
    template.items.map((item) => item.responsibleRole),
  )) {
    const userId = responsibleByRole[role];
    const user = context.users.find((entry) => entry.id === userId);
    if (!user?.isActive || user.role !== role)
      throw new ConflictError(
        `La persona asignada para ${role} no está activa o no tiene ese rol.`,
        'INVALID_TEMPLATE_RESPONSIBLE',
      );
  }
};

const templateApplies = (
  template: NonNullable<InspectionPlanContext['template']>,
  date: Date,
): boolean =>
  template.validFrom <= date &&
  (template.validTo === null || template.validTo >= date);
