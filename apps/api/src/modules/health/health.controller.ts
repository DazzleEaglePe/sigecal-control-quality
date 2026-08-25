import type { RequestHandler } from 'express';

import type { HealthResponse } from '@sigecal/shared';

import type { HealthCheckUseCase } from './health.types.js';

export const createHealthController =
  (healthService: HealthCheckUseCase): RequestHandler =>
  async (_request, response, next): Promise<void> => {
    try {
      const data = await healthService.execute();
      const body: HealthResponse = { success: true, data };
      response.status(200).json(body);
    } catch (error) {
      next(error);
    }
  };
