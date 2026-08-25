import type {
  CreateSensoryThresholdRequest,
  CreateStandardRequest,
  EffectiveSensoryThresholdQuery,
  EffectiveStandardQuery,
  SensoryThresholdHistoryQuery,
  SensoryThresholdItem,
  StandardHistoryQuery,
  StandardItem,
  UpdateStandardRequest,
} from '@sigecal/shared';

import {
  ConflictError,
  NotFoundError,
  UnprocessableEntityError,
} from '../../errors/app-error.js';
import type {
  StandardRecord,
  StandardRepositoryPort,
  StandardsUseCases,
  ThresholdRecord,
  ThresholdRepositoryPort,
} from './standards.types.js';

const dateText = (date: Date): string => date.toISOString().slice(0, 10);
const toStandard = (record: StandardRecord): StandardItem => ({
  ...record,
  minValue: record.minValue?.toString() ?? null,
  maxValue: record.maxValue?.toString() ?? null,
  targetValue: record.targetValue?.toString() ?? null,
  validFrom: dateText(record.validFrom),
  validTo: record.validTo ? dateText(record.validTo) : null,
});
const toThreshold = (record: ThresholdRecord): SensoryThresholdItem => ({
  ...record,
  minAverage: record.minAverage.toString(),
  validFrom: dateText(record.validFrom),
  validTo: record.validTo ? dateText(record.validTo) : null,
});
interface VersionRecord {
  readonly id: string;
  readonly validFrom: Date;
  readonly validTo: Date | null;
}
const previousVersion = (
  overlaps: readonly VersionRecord[],
  validFrom: string,
): string | undefined => {
  const start = new Date(`${validFrom}T00:00:00.000Z`);
  const closable = overlaps.filter(
    (item) => !item.validTo && item.validFrom < start,
  );
  const blockers = overlaps.filter((item) => !closable.includes(item));
  if (blockers.length > 0 || closable.length > 1) {
    throw new ConflictError(
      'El intervalo de vigencia se superpone con otra versión.',
      'OVERLAPPING_VALIDITY',
    );
  }
  return closable[0]?.id;
};

const orderedLimits = (
  minValue: number | null,
  targetValue: number | null,
  maxValue: number | null,
): boolean => {
  if (minValue !== null && maxValue !== null && minValue > maxValue)
    return false;
  if (targetValue !== null && minValue !== null && targetValue < minValue)
    return false;
  return !(targetValue !== null && maxValue !== null && targetValue > maxValue);
};

const selectStandard = (
  records: readonly StandardRecord[],
  query: EffectiveStandardQuery,
): StandardRecord => {
  const confirmed =
    query.dataOrigin === 'REAL'
      ? records.filter((item) => !item.isProvisional)
      : [...records];
  if (
    confirmed.length === 0 &&
    records.length > 0 &&
    query.dataOrigin === 'REAL'
  ) {
    throw new UnprocessableEntityError(
      'Solo existe un estándar provisional para esos datos.',
      'PROVISIONAL_STANDARD_FOR_REAL_DATA',
    );
  }
  const sorted = confirmed.sort((left, right) => {
    const score = (item: StandardRecord) =>
      (item.piscoTypeId ? 2 : 0) + (item.stageId ? 1 : 0);
    return (
      score(right) - score(left) ||
      right.validFrom.getTime() - left.validFrom.getTime()
    );
  });
  const selected = sorted[0];
  if (!selected)
    throw new UnprocessableEntityError(
      'No existe un estándar vigente para la fecha y ámbito.',
      'NO_EFFECTIVE_STANDARD',
    );
  return selected;
};

export class StandardsService implements StandardsUseCases {
  public constructor(
    private readonly standards: StandardRepositoryPort,
    private readonly thresholds: ThresholdRepositoryPort,
  ) {}

  public async list(
    query: StandardHistoryQuery,
  ): Promise<readonly StandardItem[]> {
    return (await this.standards.list(query)).map(toStandard);
  }

  public async create(
    input: CreateStandardRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<StandardItem> {
    if (!(await this.standards.referencesExist(input))) {
      throw new NotFoundError(
        'El parámetro o ámbito seleccionado no está activo.',
      );
    }
    const previousId = previousVersion(
      await this.standards.findOverlaps(input),
      input.validFrom,
    );
    return toStandard(
      await this.standards.create(input, actorId, previousId, ipAddress),
    );
  }

  public async update(
    id: string,
    input: UpdateStandardRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<StandardItem> {
    const current = await this.standards.findById(id);
    if (!current) throw new NotFoundError('El estándar no existe.');
    if ((await this.standards.resultCount(id)) > 0) {
      throw new ConflictError(
        'El estándar ya fue aplicado y no puede modificarse.',
        'STANDARD_ALREADY_APPLIED',
      );
    }
    this.ensureMergedLimits(current, input);
    return toStandard(
      await this.standards.update(id, input, actorId, ipAddress),
    );
  }

  public async effective(query: EffectiveStandardQuery): Promise<StandardItem> {
    return toStandard(
      selectStandard(await this.standards.findCandidates(query), query),
    );
  }

  public async listThresholds(
    query: SensoryThresholdHistoryQuery,
  ): Promise<readonly SensoryThresholdItem[]> {
    return (await this.thresholds.list(query)).map(toThreshold);
  }

  public async createThreshold(
    input: CreateSensoryThresholdRequest,
    actorId: string,
    ipAddress?: string,
  ): Promise<SensoryThresholdItem> {
    if (
      input.piscoTypeId &&
      !(await this.thresholds.piscoTypeExists(input.piscoTypeId))
    ) {
      throw new NotFoundError('El tipo de pisco seleccionado no está activo.');
    }
    const previousId = previousVersion(
      await this.thresholds.findOverlaps(input),
      input.validFrom,
    );
    return toThreshold(
      await this.thresholds.create(input, actorId, previousId, ipAddress),
    );
  }

  public async effectiveThreshold(
    query: EffectiveSensoryThresholdQuery,
  ): Promise<SensoryThresholdItem> {
    const records = await this.thresholds.findCandidates(query);
    const available =
      query.dataOrigin === 'REAL'
        ? records.filter((item) => !item.isProvisional)
        : [...records];
    if (
      available.length === 0 &&
      records.length > 0 &&
      query.dataOrigin === 'REAL'
    ) {
      throw new UnprocessableEntityError(
        'Solo existe un umbral provisional para esos datos.',
        'PROVISIONAL_STANDARD_FOR_REAL_DATA',
      );
    }
    const selected = available.sort(
      (left, right) =>
        Number(Boolean(right.piscoTypeId)) -
          Number(Boolean(left.piscoTypeId)) ||
        right.validFrom.getTime() - left.validFrom.getTime(),
    )[0];
    if (!selected)
      throw new UnprocessableEntityError(
        'No existe un umbral sensorial vigente.',
        'NO_EFFECTIVE_SENSORY_THRESHOLD',
      );
    return toThreshold(selected);
  }

  private ensureMergedLimits(
    current: StandardRecord,
    input: UpdateStandardRequest,
  ): void {
    const value = (
      next: number | null | undefined,
      previous: StandardRecord['minValue'],
    ): number | null =>
      next === undefined ? (previous?.toNumber() ?? null) : next;
    const min = value(input.minValue, current.minValue);
    const target = value(input.targetValue, current.targetValue);
    const max = value(input.maxValue, current.maxValue);
    if (
      (min === null && target === null && max === null) ||
      !orderedLimits(min, target, max)
    ) {
      throw new ConflictError(
        'Los límites resultantes no son válidos.',
        'INVALID_STANDARD_LIMITS',
      );
    }
  }
}
