import { describe, expect, it } from 'vitest';

import type {
  CreateSensoryThresholdRequest,
  EffectiveSensoryThresholdQuery,
  SensoryThresholdHistoryQuery,
} from '@sigecal/shared';

import { Prisma } from '../../generated/prisma/client.js';
import { StandardsService } from './standards.service.js';
import type {
  StandardRepositoryPort,
  ThresholdRecord,
  ThresholdRepositoryPort,
} from './standards.types.js';

const piscoId = '33333333-3333-4333-a333-333333333333';
const threshold = (
  overrides: Partial<ThresholdRecord> = {},
): ThresholdRecord => ({
  id: '11111111-1111-4111-a111-111111111111',
  piscoTypeId: null,
  minAverage: new Prisma.Decimal(3),
  defaultSeverity: 'MODERADA',
  referenceNorm: null,
  validFrom: new Date('2026-01-01T00:00:00.000Z'),
  validTo: null,
  isActive: true,
  isProvisional: false,
  ...overrides,
});

class MemoryThresholds implements ThresholdRepositoryPort {
  public records: ThresholdRecord[] = [];
  public overlaps: ThresholdRecord[] = [];
  public exists = true;
  public previousId: string | undefined;
  public list(_query: SensoryThresholdHistoryQuery) {
    void _query;
    return Promise.resolve(this.records);
  }
  public findOverlaps(_input: CreateSensoryThresholdRequest) {
    void _input;
    return Promise.resolve(this.overlaps);
  }
  public findCandidates(_query: EffectiveSensoryThresholdQuery) {
    void _query;
    return Promise.resolve(this.records);
  }
  public piscoTypeExists() {
    return Promise.resolve(this.exists);
  }
  public create(
    input: CreateSensoryThresholdRequest,
    _actor: string,
    previousId?: string,
  ) {
    void _actor;
    this.previousId = previousId;
    return Promise.resolve(
      threshold({
        piscoTypeId: input.piscoTypeId ?? null,
        minAverage: new Prisma.Decimal(input.minAverage),
        validFrom: new Date(`${input.validFrom}T00:00:00.000Z`),
        isProvisional: input.isProvisional,
      }),
    );
  }
}

const unusedStandards: StandardRepositoryPort = {
  list: () => Promise.resolve([]),
  findById: () => Promise.resolve(null),
  findOverlaps: () => Promise.resolve([]),
  findCandidates: () => Promise.resolve([]),
  referencesExist: () => Promise.resolve(true),
  resultCount: () => Promise.resolve(0),
  create: () => Promise.reject(new Error('unused')),
  update: () => Promise.reject(new Error('unused')),
};
const query: EffectiveSensoryThresholdQuery = {
  piscoTypeId: piscoId,
  date: '2026-09-01',
  dataOrigin: 'REAL',
};

describe('resolución de umbrales sensoriales', () => {
  it('prioriza el tipo de pisco sobre el umbral general', async () => {
    const repository = new MemoryThresholds();
    repository.records = [
      threshold(),
      threshold({
        id: '22222222-2222-4222-a222-222222222222',
        piscoTypeId: piscoId,
      }),
    ];
    const result = await new StandardsService(
      unusedStandards,
      repository,
    ).effectiveThreshold(query);
    expect(result.piscoTypeId).toBe(piscoId);
  });

  it('no aplica umbrales provisionales a datos reales', async () => {
    const repository = new MemoryThresholds();
    repository.records = [threshold({ isProvisional: true })];
    await expect(
      new StandardsService(unusedStandards, repository).effectiveThreshold(
        query,
      ),
    ).rejects.toMatchObject({ code: 'PROVISIONAL_STANDARD_FOR_REAL_DATA' });
  });
});

describe('versionado de umbrales sensoriales', () => {
  it('cierra la versión abierta anterior del mismo ámbito', async () => {
    const repository = new MemoryThresholds();
    repository.overlaps = [threshold()];
    const input: CreateSensoryThresholdRequest = {
      piscoTypeId: piscoId,
      minAverage: 3.5,
      defaultSeverity: 'MODERADA',
      validFrom: '2026-09-01',
      isProvisional: true,
    };
    await new StandardsService(unusedStandards, repository).createThreshold(
      input,
      piscoId,
    );
    expect(repository.previousId).toBe(threshold().id);
  });
});
