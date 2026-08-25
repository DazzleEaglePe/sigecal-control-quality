import type {
  CatalogListQuery,
  CreateEquipmentRequest,
  CreateGrapeVarietyRequest,
  CreateParameterRequest,
  CreatePiscoTypeRequest,
  CreateProcessStageRequest,
  CreateSensoryAttributeRequest,
  EquipmentItem,
  GrapeVarietyItem,
  ParameterItem,
  PiscoTypeItem,
  ProcessStageItem,
  SensoryAttributeItem,
  UpdateEquipmentRequest,
  UpdateGrapeVarietyRequest,
  UpdateParameterRequest,
  UpdatePiscoTypeRequest,
  UpdateProcessStageRequest,
  UpdateSensoryAttributeRequest,
} from '@sigecal/shared';

export type CatalogKind =
  | 'varieties'
  | 'pisco-types'
  | 'stages'
  | 'equipment'
  | 'sensory-attributes'
  | 'parameters';
export type CatalogItem =
  | GrapeVarietyItem
  | PiscoTypeItem
  | ProcessStageItem
  | EquipmentItem
  | SensoryAttributeItem
  | ParameterItem;
export type CatalogCreateInput =
  | CreateGrapeVarietyRequest
  | CreatePiscoTypeRequest
  | CreateProcessStageRequest
  | CreateEquipmentRequest
  | CreateSensoryAttributeRequest
  | CreateParameterRequest;
export type CatalogUpdateInput =
  | UpdateGrapeVarietyRequest
  | UpdatePiscoTypeRequest
  | UpdateProcessStageRequest
  | UpdateEquipmentRequest
  | UpdateSensoryAttributeRequest
  | UpdateParameterRequest;

export interface CatalogRepositoryPort {
  list(
    kind: CatalogKind,
    query: CatalogListQuery,
  ): Promise<readonly CatalogItem[]>;
  findById(kind: CatalogKind, id: string): Promise<CatalogItem | null>;
  findByCode(kind: CatalogKind, code: string): Promise<CatalogItem | null>;
  findBySequence(
    kind: CatalogKind,
    sequence: number,
  ): Promise<CatalogItem | null>;
  countReferences(kind: CatalogKind, id: string): Promise<number>;
  create(
    kind: CatalogKind,
    input: CatalogCreateInput,
    actorId: string,
    ipAddress?: string,
  ): Promise<CatalogItem>;
  update(
    kind: CatalogKind,
    id: string,
    input: CatalogUpdateInput,
    actorId: string,
    ipAddress?: string,
  ): Promise<CatalogItem>;
}

export interface CatalogsUseCases {
  list(
    kind: CatalogKind,
    query: CatalogListQuery,
  ): Promise<readonly CatalogItem[]>;
  create(
    kind: CatalogKind,
    input: CatalogCreateInput,
    actorId: string,
    ipAddress?: string,
  ): Promise<CatalogItem>;
  update(
    kind: CatalogKind,
    id: string,
    input: CatalogUpdateInput,
    actorId: string,
    ipAddress?: string,
  ): Promise<CatalogItem>;
}
