import { Role } from '@sigecal/shared';
import type {
  CorrectPhysChemResultRequest,
  CreatePhysChemResultsRequest,
  PhysChemControlChartQuery,
  PhysChemHistoryQuery,
  PhysChemResultListQuery,
  ValidatePhysChemResultsRequest,
} from '@sigecal/shared';

import { ForbiddenError, NotFoundError } from '../../errors/app-error.js';
import { toPhysChemResult, toValidation } from './physchem.mapper.js';
import {
  ensureCorrectionContext,
  ensureExpectedParameters,
  ensureReadyInspection,
  ensureResultRecorder,
  evaluateMeasurements,
} from './physchem.rules.js';
import { buildControlChart } from './physchem.statistics.js';
import type {
  EvaluatedMeasurement,
  PhysChemActor,
  PhysChemInspectionContext,
  PhysChemMutationRepositoryPort,
  PhysChemReadRepositoryPort,
  PhysChemResultRecord,
  PhysChemUseCases,
} from './physchem.types.js';

export class PhysChemService implements PhysChemUseCases {
  public constructor(
    private readonly results: PhysChemReadRepositoryPort,
    private readonly mutations: PhysChemMutationRepositoryPort,
  ) {}

  public async list(query: PhysChemResultListQuery, actor: PhysChemActor) {
    return this.mapList(await this.results.list(query, actor));
  }

  public async validate(
    input: ValidatePhysChemResultsRequest,
    actor: PhysChemActor,
  ) {
    const { evaluations } = await this.prepare(input, actor, false);
    return evaluations.map(toValidation);
  }

  public async create(
    input: CreatePhysChemResultsRequest,
    actor: PhysChemActor,
    ipAddress?: string,
  ) {
    const { inspection, evaluations } = await this.prepare(input, actor, true);
    const ids = await this.mutations.create(
      inspection,
      evaluations,
      actor.userId,
      ipAddress,
    );
    return (await this.results.findByIds(ids)).map(toPhysChemResult);
  }

  public async correct(
    id: string,
    input: CorrectPhysChemResultRequest,
    actor: PhysChemActor,
    ipAddress?: string,
  ) {
    const context = await this.results.findCorrectionContext(
      id,
      input.equipmentId,
      actor,
    );
    ensureCorrectionContext(context);
    ensureResultRecorder(actor, context.inspection);
    const standards = await this.results.findStandards(
      [context.result.parameterId],
      context.inspection,
    );
    const evaluation = evaluateMeasurements(
      [
        {
          parameterId: context.result.parameterId,
          value: input.value,
          observation: input.observation,
        },
      ],
      standards,
      context.inspection,
    )[0];
    if (!evaluation)
      throw new NotFoundError('No se pudo evaluar el resultado.');
    const ids = await this.mutations.correct(
      context,
      input,
      evaluation,
      actor.userId,
      ipAddress,
    );
    return this.correctionResult(ids.annulledId, ids.replacementId);
  }

  public async history(query: PhysChemHistoryQuery, actor: PhysChemActor) {
    return this.mapList(await this.results.history(query, actor));
  }

  public async controlChart(
    query: PhysChemControlChartQuery,
    actor: PhysChemActor,
  ) {
    if (
      query.includeDemo &&
      actor.role !== Role.ADMIN &&
      actor.role !== Role.JEFE_CALIDAD
    )
      throw new ForbiddenError(
        'Solo ADMIN o JEFE_CALIDAD puede incluir datos de demostración.',
      );
    return buildControlChart(
      await this.results.controlChart(query, actor),
      query.includeDemo,
    );
  }

  private async prepare(
    input: ValidatePhysChemResultsRequest,
    actor: PhysChemActor,
    rejectRecorded: boolean,
  ): Promise<{
    readonly inspection: PhysChemInspectionContext;
    readonly evaluations: readonly EvaluatedMeasurement[];
  }> {
    const inspection = await this.results.findInspection(
      input.inspectionId,
      actor,
    );
    ensureReadyInspection(inspection);
    ensureResultRecorder(actor, inspection);
    const parameterIds = input.results.map((result) => result.parameterId);
    ensureExpectedParameters(inspection, parameterIds, rejectRecorded);
    const standards = await this.results.findStandards(
      parameterIds,
      inspection,
    );
    return {
      inspection,
      evaluations: evaluateMeasurements(input.results, standards, inspection),
    };
  }

  private mapList(result: {
    readonly items: readonly PhysChemResultRecord[];
    readonly total: number;
  }) {
    return { data: result.items.map(toPhysChemResult), total: result.total };
  }

  private async correctionResult(annulledId: string, replacementId: string) {
    const records = await this.results.findByIds([annulledId, replacementId]);
    const annulled = records.find((record) => record.id === annulledId);
    const replacement = records.find((record) => record.id === replacementId);
    if (!annulled || !replacement)
      throw new NotFoundError('No fue posible recuperar la corrección.');
    return {
      annulled: toPhysChemResult(annulled),
      replacement: toPhysChemResult(replacement),
      nonConformity: replacement.nonConformity,
    };
  }
}
