import { Router } from 'express';

import { createHealthController } from './health.controller.js';
import type { HealthCheckUseCase } from './health.types.js';

export const createHealthRouter = (
  healthService: HealthCheckUseCase,
): Router => {
  const router = Router();
  router.get('/', createHealthController(healthService));
  return router;
};
