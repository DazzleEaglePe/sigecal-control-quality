import type {
  CreateInspectionTemplateRequest,
  EquipmentStatus,
  InspectionTemplateItem,
  InspectionTemplateListQuery,
  InspectionType,
  ParameterType,
  Role,
} from '@sigecal/shared';

export interface TemplateActor {
  readonly userId: string;
  readonly role: Role;
}

export interface TemplateReferenceRecord {
  readonly id: string;
  readonly code: string;
  readonly name: string;
}

export interface TemplatePersonRecord {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
}

export interface TemplateEquipmentRecord extends TemplateReferenceRecord {
  readonly status: EquipmentStatus;
}

export interface TemplateParameterRecord extends TemplateReferenceRecord {
  readonly type: ParameterType;
  readonly unit: string | null;
}

export interface InspectionTemplateRecord {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly piscoType: TemplateReferenceRecord;
  readonly piscoTypeId: string;
  readonly validFrom: Date;
  readonly validTo: Date | null;
  readonly isActive: boolean;
  readonly createdBy: TemplatePersonRecord;
  readonly items: readonly {
    readonly id: string;
    readonly stage: TemplateReferenceRecord;
    readonly type: InspectionType;
    readonly offsetDaysFromBatchStart: number;
    readonly scheduledLocalTime: Date;
    readonly responsibleRole: Role;
    readonly equipment: TemplateEquipmentRecord | null;
    readonly parameters: readonly {
      readonly parameter: TemplateParameterRecord;
    }[];
  }[];
}

export interface TemplateCatalogReferences {
  readonly piscoTypeActive: boolean;
  readonly activeStageIds: readonly string[];
  readonly activeEquipmentIds: readonly string[];
  readonly parameters: readonly {
    readonly id: string;
    readonly type: 'FISICOQUIMICO' | 'SENSORIAL';
    readonly isActive: boolean;
  }[];
}

export interface InspectionTemplateRepositoryPort {
  list(query: InspectionTemplateListQuery): Promise<{
    readonly items: readonly InspectionTemplateRecord[];
    readonly total: number;
  }>;
  findById(id: string): Promise<InspectionTemplateRecord | null>;
  findByCode(code: string): Promise<InspectionTemplateRecord | null>;
  findOverlaps(
    input: CreateInspectionTemplateRequest,
  ): Promise<readonly InspectionTemplateRecord[]>;
  findReferences(
    input: CreateInspectionTemplateRequest,
  ): Promise<TemplateCatalogReferences>;
  create(
    input: CreateInspectionTemplateRequest,
    actorId: string,
    previousId?: string,
    ipAddress?: string,
  ): Promise<InspectionTemplateRecord>;
  deactivate(
    id: string,
    actorId: string,
    ipAddress?: string,
  ): Promise<InspectionTemplateRecord>;
}

export interface InspectionTemplatesUseCases {
  list(query: InspectionTemplateListQuery): Promise<{
    readonly data: readonly InspectionTemplateItem[];
    readonly total: number;
  }>;
  create(
    input: CreateInspectionTemplateRequest,
    actor: TemplateActor,
    ipAddress?: string,
  ): Promise<InspectionTemplateItem>;
  deactivate(
    id: string,
    actor: TemplateActor,
    ipAddress?: string,
  ): Promise<InspectionTemplateItem>;
}
