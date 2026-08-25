import {
  EquipmentListResponseSchema,
  EquipmentResponseSchema,
  GrapeVarietyListResponseSchema,
  GrapeVarietyResponseSchema,
  ParameterListResponseSchema,
  ParameterResponseSchema,
  PiscoTypeListResponseSchema,
  PiscoTypeResponseSchema,
  ProcessStageListResponseSchema,
  ProcessStageResponseSchema,
  SensoryAttributeListResponseSchema,
  SensoryAttributeResponseSchema,
  type EquipmentItem,
  type GrapeVarietyItem,
  type ParameterItem,
  type PiscoTypeItem,
  type ProcessStageItem,
  type SensoryAttributeItem,
} from '@sigecal/shared';

import type { AuthorizedRequest } from '../auth/auth-context.js';

export type CatalogKind =
  | 'varieties'
  | 'pisco-types'
  | 'stages'
  | 'equipment'
  | 'sensory-attributes'
  | 'parameters';

export type CatalogItem =
  | EquipmentItem
  | GrapeVarietyItem
  | ParameterItem
  | PiscoTypeItem
  | ProcessStageItem
  | SensoryAttributeItem;

const parseList = (
  kind: CatalogKind,
  value: unknown,
): readonly CatalogItem[] => {
  switch (kind) {
    case 'varieties':
      return GrapeVarietyListResponseSchema.parse(value).data;
    case 'pisco-types':
      return PiscoTypeListResponseSchema.parse(value).data;
    case 'stages':
      return ProcessStageListResponseSchema.parse(value).data;
    case 'equipment':
      return EquipmentListResponseSchema.parse(value).data;
    case 'sensory-attributes':
      return SensoryAttributeListResponseSchema.parse(value).data;
    case 'parameters':
      return ParameterListResponseSchema.parse(value).data;
  }
};

const parseItem = (kind: CatalogKind, value: unknown): CatalogItem => {
  switch (kind) {
    case 'varieties':
      return GrapeVarietyResponseSchema.parse(value).data;
    case 'pisco-types':
      return PiscoTypeResponseSchema.parse(value).data;
    case 'stages':
      return ProcessStageResponseSchema.parse(value).data;
    case 'equipment':
      return EquipmentResponseSchema.parse(value).data;
    case 'sensory-attributes':
      return SensoryAttributeResponseSchema.parse(value).data;
    case 'parameters':
      return ParameterResponseSchema.parse(value).data;
  }
};

export function listCatalog(
  request: AuthorizedRequest,
  kind: 'parameters',
): Promise<readonly ParameterItem[]>;
export function listCatalog(
  request: AuthorizedRequest,
  kind: 'varieties',
): Promise<readonly GrapeVarietyItem[]>;
export function listCatalog(
  request: AuthorizedRequest,
  kind: 'pisco-types',
): Promise<readonly PiscoTypeItem[]>;
export function listCatalog(
  request: AuthorizedRequest,
  kind: 'stages',
): Promise<readonly ProcessStageItem[]>;
export function listCatalog(
  request: AuthorizedRequest,
  kind: CatalogKind,
): Promise<readonly CatalogItem[]>;
export async function listCatalog(
  request: AuthorizedRequest,
  kind: CatalogKind,
): Promise<readonly CatalogItem[]> {
  return parseList(kind, await request<unknown>(`/masters/${kind}`));
}

export const createCatalogItem = async (
  request: AuthorizedRequest,
  kind: CatalogKind,
  input: unknown,
): Promise<CatalogItem> => {
  const response = await request<unknown>(`/masters/${kind}`, {
    method: 'POST',
    body: input,
  });
  return parseItem(kind, response);
};

export const setCatalogStatus = async (
  request: AuthorizedRequest,
  kind: CatalogKind,
  item: CatalogItem,
): Promise<CatalogItem> => {
  const response = await request<unknown>(`/masters/${kind}/${item.id}`, {
    method: 'PATCH',
    body: { isActive: !item.isActive },
  });
  return parseItem(kind, response);
};
