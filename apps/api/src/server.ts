import type { Server } from 'node:http';

import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './config/prisma.js';
import { InspectionMutationRepository } from './modules/inspections/inspections.mutations.js';
import { startInspectionOverdueJob } from './modules/inspections/inspections.overdue-job.js';

const app = createApp();
const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'API de SIGECAL disponible');
});
const overdueJob = startInspectionOverdueJob(
  new InspectionMutationRepository(prisma),
);

const closeServer = (httpServer: Server): Promise<void> =>
  new Promise((resolve, reject) => {
    httpServer.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });

let isShuttingDown = false;

const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info({ signal }, 'Iniciando apagado ordenado');

  try {
    clearInterval(overdueJob);
    await closeServer(server);
    await prisma.$disconnect();
    logger.info('API y conexión de base cerradas correctamente');
  } catch (error) {
    logger.error({ err: error }, 'Falló el apagado ordenado');
    process.exitCode = 1;
  }
};

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));
