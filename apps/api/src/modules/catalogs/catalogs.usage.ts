import type { PrismaClient } from '../../generated/prisma/client.js';
import type { CatalogKind } from './catalogs.types.js';

type CatalogUsageDb = Pick<
  PrismaClient,
  | 'batch'
  | 'batchGrapeVariety'
  | 'batchStage'
  | 'inspection'
  | 'inspectionParameter'
  | 'inspectionTemplate'
  | 'inspectionTemplateItem'
  | 'inspectionTemplateParameter'
  | 'nonConformity'
  | 'physChemResult'
  | 'sensoryScore'
  | 'sensoryThreshold'
  | 'standard'
>;

const total = (counts: readonly number[]): number =>
  counts.reduce((sum, count) => sum + count, 0);

const countPiscoTypeReferences = async (db: CatalogUsageDb, id: string) =>
  total(
    await Promise.all([
      db.standard.count({ where: { piscoTypeId: id } }),
      db.sensoryThreshold.count({ where: { piscoTypeId: id } }),
      db.batch.count({ where: { piscoTypeId: id } }),
      db.inspectionTemplate.count({ where: { piscoTypeId: id } }),
    ]),
  );

const countStageReferences = async (db: CatalogUsageDb, id: string) =>
  total(
    await Promise.all([
      db.standard.count({ where: { stageId: id } }),
      db.batch.count({ where: { currentStageId: id } }),
      db.batchStage.count({ where: { stageId: id } }),
      db.inspection.count({ where: { stageId: id } }),
      db.inspectionTemplateItem.count({ where: { stageId: id } }),
      db.nonConformity.count({ where: { stageId: id } }),
    ]),
  );

const countEquipmentReferences = async (db: CatalogUsageDb, id: string) =>
  total(
    await Promise.all([
      db.inspection.count({ where: { equipmentId: id } }),
      db.inspectionTemplateItem.count({ where: { equipmentId: id } }),
      db.physChemResult.count({ where: { equipmentId: id } }),
    ]),
  );

const countParameterReferences = async (db: CatalogUsageDb, id: string) =>
  total(
    await Promise.all([
      db.standard.count({ where: { parameterId: id } }),
      db.inspectionParameter.count({ where: { parameterId: id } }),
      db.inspectionTemplateParameter.count({ where: { parameterId: id } }),
      db.physChemResult.count({ where: { parameterId: id } }),
    ]),
  );

export const countCatalogReferences = async (
  db: CatalogUsageDb,
  kind: CatalogKind,
  id: string,
): Promise<number> => {
  switch (kind) {
    case 'varieties':
      return db.batchGrapeVariety.count({ where: { varietyId: id } });
    case 'sensory-attributes':
      return db.sensoryScore.count({ where: { attributeId: id } });
    case 'pisco-types':
      return countPiscoTypeReferences(db, id);
    case 'stages':
      return countStageReferences(db, id);
    case 'equipment':
      return countEquipmentReferences(db, id);
    case 'parameters':
      return countParameterReferences(db, id);
  }
};
