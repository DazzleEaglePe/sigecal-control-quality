import cors, { type CorsOptions } from 'cors';
import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';
import helmet from 'helmet';

import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';
import { HealthRepository } from './modules/health/health.repository.js';
import { createHealthRouter } from './modules/health/health.routes.js';
import { HealthService } from './modules/health/health.service.js';
import type { HealthCheckUseCase } from './modules/health/health.types.js';
import { AuthRepository } from './modules/auth/auth.repository.js';
import { AuthService } from './modules/auth/auth.service.js';
import { BcryptPasswordService } from './modules/auth/auth.password.js';
import { JwtTokenService } from './modules/auth/auth.tokens.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import type { AuthUseCases } from './modules/auth/auth.types.js';
import { AreaRepository } from './modules/areas/areas.repository.js';
import { createAreasRouter } from './modules/areas/areas.routes.js';
import { AreasService } from './modules/areas/areas.service.js';
import type { AreasUseCases } from './modules/areas/areas.types.js';
import { UserRepository } from './modules/users/users.repository.js';
import { createUsersRouter } from './modules/users/users.routes.js';
import { UsersService } from './modules/users/users.service.js';
import type { UsersUseCases } from './modules/users/users.types.js';
import { StandardRepository } from './modules/standards/standards.repository.js';
import { ThresholdRepository } from './modules/standards/thresholds.repository.js';
import { StandardsService } from './modules/standards/standards.service.js';
import { createStandardsRouter } from './modules/standards/standards.routes.js';
import type { StandardsUseCases } from './modules/standards/standards.types.js';
import { CatalogRepository } from './modules/catalogs/catalogs.repository.js';
import { createCatalogsRouter } from './modules/catalogs/catalogs.routes.js';
import { CatalogsService } from './modules/catalogs/catalogs.service.js';
import type { CatalogsUseCases } from './modules/catalogs/catalogs.types.js';
import { BatchMutationRepository } from './modules/batches/batches.mutations.js';
import { BatchRepository } from './modules/batches/batches.repository.js';
import { createBatchesRouter } from './modules/batches/batches.routes.js';
import { BatchesService } from './modules/batches/batches.service.js';
import type { BatchesUseCases } from './modules/batches/batches.types.js';

export interface AppDependencies {
  readonly authService?: AuthUseCases;
  readonly batchesService?: BatchesUseCases;
  readonly catalogsService?: CatalogsUseCases;
  readonly areasService?: AreasUseCases;
  readonly healthService?: HealthCheckUseCase;
  readonly standardsService?: StandardsUseCases;
  readonly usersService?: UsersUseCases;
}

const defaultHealthService = (): HealthCheckUseCase =>
  new HealthService(new HealthRepository(prisma));

const defaultBatchesService = (): BatchesUseCases =>
  new BatchesService(
    new BatchRepository(prisma),
    new BatchMutationRepository(prisma),
  );

const defaultAuthService = (): AuthUseCases =>
  new AuthService(
    new AuthRepository(prisma),
    new JwtTokenService(),
    new BcryptPasswordService(),
  );

const defaultAreasService = (): AreasUseCases =>
  new AreasService(new AreaRepository(prisma));

const defaultCatalogsService = (): CatalogsUseCases =>
  new CatalogsService(new CatalogRepository(prisma));

const defaultUsersService = (): UsersUseCases =>
  new UsersService(new UserRepository(prisma), new BcryptPasswordService());

const defaultStandardsService = (): StandardsUseCases =>
  new StandardsService(
    new StandardRepository(prisma),
    new ThresholdRepository(prisma),
  );

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    callback(null, origin === undefined || origin === env.CORS_ORIGIN);
  },
  credentials: true,
};

const configureMiddleware = (app: Express): void => {
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
};

export const createApp = (dependencies: AppDependencies = {}): Express => {
  const app = express();
  const authService = dependencies.authService ?? defaultAuthService();
  const batchesService = dependencies.batchesService ?? defaultBatchesService();
  const areasService = dependencies.areasService ?? defaultAreasService();
  const catalogsService =
    dependencies.catalogsService ?? defaultCatalogsService();
  const healthService = dependencies.healthService ?? defaultHealthService();
  const standardsService =
    dependencies.standardsService ?? defaultStandardsService();
  const usersService = dependencies.usersService ?? defaultUsersService();

  configureMiddleware(app);

  app.use(`${env.API_PREFIX}/health`, createHealthRouter(healthService));
  app.use(`${env.API_PREFIX}/auth`, createAuthRouter(authService));
  app.use(
    `${env.API_PREFIX}/batches`,
    createBatchesRouter(authService, batchesService),
  );
  app.use(
    `${env.API_PREFIX}/masters/areas`,
    createAreasRouter(authService, areasService),
  );
  app.use(
    `${env.API_PREFIX}/masters`,
    createStandardsRouter(authService, standardsService),
  );
  app.use(
    `${env.API_PREFIX}/masters`,
    createCatalogsRouter(authService, catalogsService),
  );
  app.use(
    `${env.API_PREFIX}/users`,
    createUsersRouter(authService, usersService),
  );

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};
