import type { CorrectPhysChemResultRequest } from '@sigecal/shared';

import { ConflictError } from '../../errors/app-error.js';
import type { PrismaClient } from '../../generated/prisma/client.js';
import { correctPhysChemResult } from './physchem.correct.js';
import { createPhysChemResults } from './physchem.create.js';
import { retryableResultWrite } from './physchem.persistence.js';
import type {
  EvaluatedMeasurement,
  PhysChemInspectionContext,
  PhysChemMutationRepositoryPort,
} from './physchem.types.js';

const MAX_WRITE_ATTEMPTS = 3;

export class PhysChemMutationRepository implements PhysChemMutationRepositoryPort {
  public constructor(private readonly client: PrismaClient) {}

  public create(
    inspection: PhysChemInspectionContext,
    values: readonly EvaluatedMeasurement[],
    actorId: string,
    ipAddress?: string,
  ) {
    return this.retry(() =>
      createPhysChemResults(
        this.client,
        inspection,
        values,
        actorId,
        ipAddress,
      ),
    );
  }

  public correct(
    context: Parameters<PhysChemMutationRepositoryPort['correct']>[0],
    input: CorrectPhysChemResultRequest,
    evaluation: EvaluatedMeasurement,
    actorId: string,
    ipAddress?: string,
  ) {
    return this.retry(() =>
      correctPhysChemResult(
        this.client,
        context,
        input,
        evaluation,
        actorId,
        ipAddress,
      ),
    );
  }

  private async retry<T>(operation: () => Promise<T>): Promise<T> {
    for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        if (!retryableResultWrite(error) || attempt === MAX_WRITE_ATTEMPTS)
          throw error;
      }
    }
    throw new ConflictError('No fue posible guardar el resultado.');
  }
}
