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
import { AccountAccessRepository } from './modules/account-access/account-access.repository.js';
import { AccountAccessService } from './modules/account-access/account-access.service.js';
import { SecureAccountTokenService } from './modules/account-access/account-access.tokens.js';
import { SmtpAccountMailer } from './modules/account-access/account-access.mailer.js';
import { createAccountAccessRouter } from './modules/account-access/account-access.routes.js';
import type { AccountAccessUseCases } from './modules/account-access/account-access.types.js';
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
import { InspectionTemplateRepository } from './modules/inspection-templates/inspection-templates.repository.js';
import { createInspectionTemplatesRouter } from './modules/inspection-templates/inspection-templates.routes.js';
import { InspectionTemplatesService } from './modules/inspection-templates/inspection-templates.service.js';
import type { InspectionTemplatesUseCases } from './modules/inspection-templates/inspection-templates.types.js';
import { InspectionMutationRepository } from './modules/inspections/inspections.mutations.js';
import { InspectionRepository } from './modules/inspections/inspections.repository.js';
import { createInspectionsRouter } from './modules/inspections/inspections.routes.js';
import { InspectionsService } from './modules/inspections/inspections.service.js';
import type { InspectionsUseCases } from './modules/inspections/inspections.types.js';
import { PhysChemMutationRepository } from './modules/physchem/physchem.mutations.js';
import { PhysChemRepository } from './modules/physchem/physchem.repository.js';
import { createPhysChemRouter } from './modules/physchem/physchem.routes.js';
import { PhysChemService } from './modules/physchem/physchem.service.js';
import type { PhysChemUseCases } from './modules/physchem/physchem.types.js';
import { SensoryRepository } from './modules/sensory/sensory.repository.js';
import { SensoryMutationRepository } from './modules/sensory/sensory.mutations.js';
import { SensoryService } from './modules/sensory/sensory.service.js';
import { createSensoryRouter } from './modules/sensory/sensory.routes.js';
import type { SensoryUseCases } from './modules/sensory/sensory.types.js';
import { NonConformityMutationRepository } from './modules/nonconformities/nonconformities.mutations.js';
import { NonConformityRepository } from './modules/nonconformities/nonconformities.repository.js';
import { NonConformitiesService } from './modules/nonconformities/nonconformities.service.js';
import { createNonConformitiesRouter } from './modules/nonconformities/nonconformities.routes.js';
import type { NonConformitiesUseCases } from './modules/nonconformities/nonconformities.types.js';

export interface AppDependencies {
  readonly accountAccessService?: AccountAccessUseCases;
  readonly authService?: AuthUseCases;
  readonly batchesService?: BatchesUseCases;
  readonly nonConformitiesService?: NonConformitiesUseCases;
  readonly catalogsService?: CatalogsUseCases;
  readonly areasService?: AreasUseCases;
  readonly healthService?: HealthCheckUseCase;
  readonly inspectionsService?: InspectionsUseCases;
  readonly inspectionTemplatesService?: InspectionTemplatesUseCases;
  readonly physChemService?: PhysChemUseCases;
  readonly sensoryService?: SensoryUseCases;
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

const defaultInspectionsService = (): InspectionsUseCases =>
  new InspectionsService(
    new InspectionRepository(prisma),
    new InspectionMutationRepository(prisma),
  );

const defaultInspectionTemplatesService = (): InspectionTemplatesUseCases =>
  new InspectionTemplatesService(new InspectionTemplateRepository(prisma));

const defaultPhysChemService = (): PhysChemUseCases =>
  new PhysChemService(
    new PhysChemRepository(prisma),
    new PhysChemMutationRepository(prisma),
  );
const defaultSensoryService = (): SensoryUseCases =>
  new SensoryService(
    new SensoryRepository(prisma),
    new SensoryMutationRepository(prisma),
  );
const defaultNonConformitiesService = (): NonConformitiesUseCases =>
  new NonConformitiesService(
    new NonConformityRepository(prisma),
    new NonConformityMutationRepository(prisma),
  );

const defaultAuthService = (): AuthUseCases =>
  new AuthService(
    new AuthRepository(prisma),
    new JwtTokenService(),
    new BcryptPasswordService(),
  );

const defaultAccountAccessService = (): AccountAccessUseCases =>
  new AccountAccessService(
    new AccountAccessRepository(prisma),
    new SecureAccountTokenService(),
    new BcryptPasswordService(),
    new SmtpAccountMailer(),
  );

const defaultAreasService = (): AreasUseCases =>
  new AreasService(new AreaRepository(prisma));

const defaultCatalogsService = (): CatalogsUseCases =>
  new CatalogsService(new CatalogRepository(prisma));

const defaultUsersService = (): UsersUseCases =>
  new UsersService(
    new UserRepository(prisma),
    new BcryptPasswordService(),
    defaultAccountAccessService(),
  );

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

interface ResolvedServices {
  readonly accountAccess: AccountAccessUseCases;
  readonly auth: AuthUseCases;
  readonly batches: BatchesUseCases;
  readonly catalogs: CatalogsUseCases;
  readonly areas: AreasUseCases;
  readonly health: HealthCheckUseCase;
  readonly inspections: InspectionsUseCases;
  readonly templates: InspectionTemplatesUseCases;
  readonly physChem: PhysChemUseCases;
  readonly sensory: SensoryUseCases;
  readonly nonConformities: NonConformitiesUseCases;
  readonly standards: StandardsUseCases;
  readonly users: UsersUseCases;
}

const resolveTemplates = (dependencies: AppDependencies) =>
  dependencies.inspectionTemplatesService ??
  defaultInspectionTemplatesService();
const resolveNonConformities = (dependencies: AppDependencies) =>
  dependencies.nonConformitiesService ?? defaultNonConformitiesService();

const resolveServices = (dependencies: AppDependencies): ResolvedServices => ({
  accountAccess:
    dependencies.accountAccessService ?? defaultAccountAccessService(),
  auth: dependencies.authService ?? defaultAuthService(),
  batches: dependencies.batchesService ?? defaultBatchesService(),
  catalogs: dependencies.catalogsService ?? defaultCatalogsService(),
  areas: dependencies.areasService ?? defaultAreasService(),
  health: dependencies.healthService ?? defaultHealthService(),
  inspections: dependencies.inspectionsService ?? defaultInspectionsService(),
  templates: resolveTemplates(dependencies),
  physChem: dependencies.physChemService ?? defaultPhysChemService(),
  sensory: dependencies.sensoryService ?? defaultSensoryService(),
  nonConformities: resolveNonConformities(dependencies),
  standards: dependencies.standardsService ?? defaultStandardsService(),
  users: dependencies.usersService ?? defaultUsersService(),
});

const mountQualityRoutes = (app: Express, services: ResolvedServices): void => {
  app.use(
    `${env.API_PREFIX}/inspections`,
    createInspectionsRouter(services.auth, services.inspections),
  );
  app.use(
    `${env.API_PREFIX}/physchem`,
    createPhysChemRouter(services.auth, services.physChem),
  );
  app.use(
    `${env.API_PREFIX}/sensory`,
    createSensoryRouter(services.auth, services.sensory),
  );
  app.use(
    `${env.API_PREFIX}/nonconformities`,
    createNonConformitiesRouter(services.auth, services.nonConformities),
  );
};

const mountRoutes = (app: Express, services: ResolvedServices): void => {
  app.use(`${env.API_PREFIX}/health`, createHealthRouter(services.health));
  app.use(`${env.API_PREFIX}/auth`, createAuthRouter(services.auth));
  app.use(
    `${env.API_PREFIX}/auth`,
    createAccountAccessRouter(services.accountAccess),
  );
  app.use(
    `${env.API_PREFIX}/batches`,
    createBatchesRouter(services.auth, services.batches),
  );
  app.use(
    `${env.API_PREFIX}/masters/areas`,
    createAreasRouter(services.auth, services.areas),
  );
  app.use(
    `${env.API_PREFIX}/masters`,
    createStandardsRouter(services.auth, services.standards),
    createCatalogsRouter(services.auth, services.catalogs),
    createInspectionTemplatesRouter(services.auth, services.templates),
  );
  mountQualityRoutes(app, services);
  app.use(
    `${env.API_PREFIX}/users`,
    createUsersRouter(services.auth, services.users),
  );
};

export const createApp = (dependencies: AppDependencies = {}): Express => {
  const app = express();
  configureMiddleware(app);
  mountRoutes(app, resolveServices(dependencies));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};
