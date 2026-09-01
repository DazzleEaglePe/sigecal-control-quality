import type {
  CorrectSensorySessionRequest,
  CreateSensorySessionRequest,
  SensoryCompareQuery,
  SensorySessionListQuery,
} from '@sigecal/shared';
import { ConflictError, NotFoundError } from '../../errors/app-error.js';
import { toSensoryProfile, toSensorySession } from './sensory.mapper.js';
import {
  ensureCompleteMatrix,
  prepareSensoryContext,
} from './sensory.rules.js';
import type {
  SensoryActor,
  SensoryMutationRepositoryPort,
  SensoryReadRepositoryPort,
  SensoryUseCases,
} from './sensory.types.js';

export class SensoryService implements SensoryUseCases {
  public constructor(
    private readonly sessions: SensoryReadRepositoryPort,
    private readonly mutations: SensoryMutationRepositoryPort,
  ) {}

  public async list(query: SensorySessionListQuery, actor: SensoryActor) {
    const result = await this.sessions.list(query, actor);
    return { data: result.items.map(toSensorySession), total: result.total };
  }

  public async detail(id: string, actor: SensoryActor) {
    const record = await this.required(id, actor);
    return toSensorySession(record);
  }

  public async create(
    input: CreateSensorySessionRequest,
    actor: SensoryActor,
    ipAddress?: string,
  ) {
    const context = await this.prepare(input, actor);
    const id = await this.mutations.create(
      context,
      input,
      actor.userId,
      ipAddress,
    );
    return toSensorySession(await this.required(id, actor));
  }

  public async correct(
    id: string,
    input: CorrectSensorySessionRequest,
    actor: SensoryActor,
    ipAddress?: string,
  ) {
    const previous = await this.required(id, actor);
    if (previous.status === 'ANULADO' || previous.replacement)
      throw new ConflictError(
        'La sesión ya fue corregida.',
        'SENSORY_SESSION_ALREADY_CORRECTED',
      );
    const createInput = { ...input, inspectionId: previous.inspectionId };
    const context = await this.prepare(createInput, actor, true);
    const ids = await this.mutations.correct(
      previous,
      context,
      input,
      actor.userId,
      ipAddress,
    );
    const records = await this.sessions.findByIds(
      [ids.annulledId, ids.replacementId],
      actor,
    );
    const annulled = records.find(
      ({ id: itemId }) => itemId === ids.annulledId,
    );
    const replacement = records.find(
      ({ id: itemId }) => itemId === ids.replacementId,
    );
    if (!annulled || !replacement)
      throw new NotFoundError('No fue posible recuperar la corrección.');
    return {
      annulled: toSensorySession(annulled),
      replacement: toSensorySession(replacement),
    };
  }

  public async profile(id: string, actor: SensoryActor) {
    return toSensoryProfile(await this.required(id, actor));
  }

  public async compare(query: SensoryCompareQuery, actor: SensoryActor) {
    const unique = [...new Set(query.sessionIds)];
    if (unique.length !== query.sessionIds.length)
      throw new ConflictError(
        'No repita sesiones en la comparación.',
        'DUPLICATE_SESSION',
      );
    const records = await this.sessions.findByIds(unique, actor);
    if (records.length !== unique.length)
      throw new NotFoundError('Una o más sesiones no están disponibles.');
    return unique.map((id) => {
      const record = records.find((item) => item.id === id);
      if (!record) throw new NotFoundError('La sesión no está disponible.');
      return toSensoryProfile(record);
    });
  }

  public panelistOptions() {
    return this.sessions.panelistOptions();
  }

  public async preparation(inspectionId: string, actor: SensoryActor) {
    const inspection = await this.sessions.findInspection(inspectionId, actor);
    if (!inspection)
      throw new NotFoundError('La inspección no existe o no está disponible.');
    const [attributes, threshold] = await Promise.all([
      this.sessions.activeAttributes(),
      this.sessions.findThreshold(inspection),
    ]);
    if (!threshold)
      throw new NotFoundError('No existe un umbral sensorial vigente.');
    return {
      attributes: attributes.map(({ id, code, name }) => ({ id, code, name })),
      threshold: {
        id: threshold.id,
        minAverage: threshold.minAverage.toString(),
        referenceNorm: threshold.referenceNorm,
        validFrom: threshold.validFrom.toISOString().slice(0, 10),
        isProvisional: threshold.isProvisional,
      },
    };
  }

  private async prepare(
    input: CreateSensorySessionRequest,
    actor: SensoryActor,
    correction = false,
  ) {
    const inspection = await this.sessions.findInspection(
      input.inspectionId,
      actor,
    );
    const [attributes, usersValid, threshold] = await Promise.all([
      this.sessions.activeAttributes(),
      this.validUsers(input),
      inspection
        ? this.sessions.findThreshold(inspection)
        : Promise.resolve(null),
    ]);
    ensureCompleteMatrix(input, attributes);
    if (!usersValid)
      throw new NotFoundError(
        'Uno o más panelistas del sistema no están activos.',
      );
    return prepareSensoryContext(
      inspection,
      threshold,
      input,
      actor,
      correction,
    );
  }

  private validUsers(input: CreateSensorySessionRequest): Promise<boolean> {
    return this.sessions.usersExist(
      input.panelists.flatMap(({ userId }) => (userId ? [userId] : [])),
    );
  }

  private async required(id: string, actor: SensoryActor) {
    const record = await this.sessions.findById(id, actor);
    if (!record)
      throw new NotFoundError(
        'La sesión sensorial no existe o no está disponible.',
      );
    return record;
  }
}
