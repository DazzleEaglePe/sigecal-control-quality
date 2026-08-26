import { logger } from '../../config/logger.js';
import type { InspectionMutationRepositoryPort } from './inspections.types.js';

const OVERDUE_INTERVAL_MS = 60_000;

const markOverdue = async (
  mutations: InspectionMutationRepositoryPort,
): Promise<void> => {
  try {
    const changed = await mutations.markOverdue(new Date());
    if (changed > 0)
      logger.info(
        { changed },
        'Inspecciones vencidas actualizadas automáticamente',
      );
  } catch (error) {
    logger.error(
      { err: error },
      'Falló la actualización de inspecciones vencidas',
    );
  }
};

export const startInspectionOverdueJob = (
  mutations: InspectionMutationRepositoryPort,
): NodeJS.Timeout => {
  void markOverdue(mutations);
  const timer = setInterval(
    () => void markOverdue(mutations),
    OVERDUE_INTERVAL_MS,
  );
  timer.unref();
  return timer;
};
