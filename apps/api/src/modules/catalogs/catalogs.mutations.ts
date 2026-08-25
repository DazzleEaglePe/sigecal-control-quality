import type {
  CreateEquipmentRequest,
  CreateParameterRequest,
  CreatePiscoTypeRequest,
  CreateProcessStageRequest,
  CreateSensoryAttributeRequest,
  UpdateEquipmentRequest,
  UpdateParameterRequest,
  UpdatePiscoTypeRequest,
  UpdateProcessStageRequest,
  UpdateSensoryAttributeRequest,
} from '@sigecal/shared';

import type { PrismaClient } from '../../generated/prisma/client.js';
import type {
  CatalogCreateInput,
  CatalogItem,
  CatalogKind,
  CatalogUpdateInput,
} from './catalogs.types.js';

export type CatalogDb = Pick<
  PrismaClient,
  | 'grapeVariety'
  | 'piscoType'
  | 'processStage'
  | 'equipment'
  | 'sensoryAttribute'
  | 'parameter'
>;
const optionalText = (value: string | null | undefined, key: string) =>
  value === undefined ? {} : { [key]: value };

const createSpecial = (
  db: CatalogDb,
  kind: CatalogKind,
  input: CatalogCreateInput,
): Promise<CatalogItem> => {
  switch (kind) {
    case 'equipment': {
      const value = input as CreateEquipmentRequest;
      return db.equipment.create({
        data: {
          ...value,
          lastCalibrationRef: value.lastCalibrationRef ?? null,
        },
      });
    }
    case 'sensory-attributes': {
      const value = input as CreateSensoryAttributeRequest;
      return db.sensoryAttribute.create({
        data: { ...value, description: value.description ?? null },
      });
    }
    case 'parameters': {
      const value = input as CreateParameterRequest;
      return db.parameter.create({
        data: { ...value, testMethod: value.testMethod ?? null },
      });
    }
    default:
      throw new Error('Tipo de catálogo no soportado.');
  }
};

export const createWith = (
  db: CatalogDb,
  kind: CatalogKind,
  input: CatalogCreateInput,
): Promise<CatalogItem> => {
  switch (kind) {
    case 'varieties':
      return db.grapeVariety.create({ data: input });
    case 'pisco-types': {
      const value = input as CreatePiscoTypeRequest;
      return db.piscoType.create({
        data: { ...value, description: value.description ?? null },
      });
    }
    case 'stages': {
      const value = input as CreateProcessStageRequest;
      return db.processStage.create({
        data: { ...value, description: value.description ?? null },
      });
    }
    default:
      return createSpecial(db, kind, input);
  }
};

const updateIdentity = (
  db: CatalogDb,
  kind: 'varieties' | 'pisco-types',
  id: string,
  input: CatalogUpdateInput,
): Promise<CatalogItem> => {
  if (kind === 'varieties') {
    return db.grapeVariety.update({
      where: { id },
      data: {
        ...optionalText(input.code, 'code'),
        ...optionalText(input.name, 'name'),
        ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
      },
    });
  }
  const value = input as UpdatePiscoTypeRequest;
  return db.piscoType.update({
    where: { id },
    data: {
      ...optionalText(value.code, 'code'),
      ...optionalText(value.name, 'name'),
      ...optionalText(value.description, 'description'),
      ...(value.isActive === undefined ? {} : { isActive: value.isActive }),
    },
  });
};

const updateOrdered = (
  db: CatalogDb,
  kind: 'stages' | 'sensory-attributes',
  id: string,
  input: CatalogUpdateInput,
): Promise<CatalogItem> => {
  const value = input as
    UpdateProcessStageRequest | UpdateSensoryAttributeRequest;
  const data = {
    ...optionalText(value.code, 'code'),
    ...optionalText(value.name, 'name'),
    ...optionalText(value.description, 'description'),
    ...(value.sequence === undefined ? {} : { sequence: value.sequence }),
    ...(value.isActive === undefined ? {} : { isActive: value.isActive }),
  };
  return kind === 'stages'
    ? db.processStage.update({ where: { id }, data })
    : db.sensoryAttribute.update({ where: { id }, data });
};

const updateTechnical = (
  db: CatalogDb,
  kind: 'equipment' | 'parameters',
  id: string,
  input: CatalogUpdateInput,
): Promise<CatalogItem> => {
  if (kind === 'equipment') {
    const value = input as UpdateEquipmentRequest;
    return db.equipment.update({
      where: { id },
      data: {
        ...optionalText(value.code, 'code'),
        ...optionalText(value.name, 'name'),
        ...optionalText(value.lastCalibrationRef, 'lastCalibrationRef'),
        ...(value.status === undefined ? {} : { status: value.status }),
        ...(value.isActive === undefined ? {} : { isActive: value.isActive }),
      },
    });
  }
  const value = input as UpdateParameterRequest;
  return db.parameter.update({
    where: { id },
    data: {
      ...optionalText(value.code, 'code'),
      ...optionalText(value.name, 'name'),
      ...optionalText(value.unit, 'unit'),
      ...optionalText(value.testMethod, 'testMethod'),
      ...(value.type === undefined ? {} : { type: value.type }),
      ...(value.decimals === undefined ? {} : { decimals: value.decimals }),
      ...(value.isActive === undefined ? {} : { isActive: value.isActive }),
    },
  });
};

export const updateWith = (
  db: CatalogDb,
  kind: CatalogKind,
  id: string,
  input: CatalogUpdateInput,
): Promise<CatalogItem> => {
  if (kind === 'varieties' || kind === 'pisco-types') {
    return updateIdentity(db, kind, id, input);
  }
  if (kind === 'stages' || kind === 'sensory-attributes') {
    return updateOrdered(db, kind, id, input);
  }
  return updateTechnical(db, kind, id, input);
};
