import request from 'supertest';
import { describe, expect, it } from 'vitest';
import type {
  ChangePasswordRequest,
  LoginRequest,
  Role,
  UserSession,
} from '@sigecal/shared';
import {
  ApiErrorSchema,
  type BatchItem,
  ReportsDashboardResponseSchema,
} from '@sigecal/shared';

import { createApp } from '../../app.js';
import { env } from '../../config/env.js';
import type {
  AuthUseCases,
  AuthenticatedRequestUser,
  LoginResult,
  RefreshResult,
} from '../auth/auth.types.js';
import { ReportsService } from './reports.service.js';
import type {
  ReportExportRepositoryPort,
  ReportExcelRenderers,
  ReportsDataset,
  ReportsRepositoryPort,
  ReportTraceabilityPort,
} from './reports.types.js';

class RoleAuth implements AuthUseCases {
  public constructor(private readonly role: Role) {}
  public authenticate(): Promise<AuthenticatedRequestUser> {
    return Promise.resolve({
      userId: '11111111-1111-4111-a111-111111111111',
      role: this.role,
      mustChangePassword: false,
    });
  }
  public login(_input: LoginRequest): Promise<LoginResult> {
    void _input;
    return Promise.reject(new Error('unused'));
  }
  public refresh(): Promise<RefreshResult> {
    return Promise.reject(new Error('unused'));
  }
  public logout(): Promise<void> {
    return Promise.resolve();
  }
  public me(): Promise<UserSession> {
    return Promise.reject(new Error('unused'));
  }
  public changePassword(_id: string, _input: ChangePasswordRequest) {
    void _id;
    void _input;
    return Promise.resolve();
  }
}

class EmptyReportsRepository implements ReportsRepositoryPort {
  public loadDashboard(): Promise<ReportsDataset> {
    return Promise.resolve({
      results: [],
      inspections: [],
      nonConformities: [],
      batchStages: [],
    });
  }
}

class TraceabilityStub implements ReportTraceabilityPort {
  public get(): Promise<BatchItem> {
    return Promise.resolve({ code: 'LT-2026-0001' } as BatchItem);
  }
  public timeline() {
    return Promise.resolve([]);
  }
}

class ExportStub implements ReportExportRepositoryPort {
  public generator() {
    return Promise.resolve({
      fullName: 'Analista Prueba',
      email: 'analista@sigecal.demo',
    });
  }
  public recordExport(): Promise<void> {
    return Promise.resolve();
  }
  public inspections() {
    return Promise.resolve([]);
  }
  public nonConformities() {
    return Promise.resolve([]);
  }
  public results() {
    return Promise.resolve([]);
  }
}

const excelRenderers: ReportExcelRenderers = {
  inspections: () => Promise.resolve(Buffer.from('PK inspecciones')),
  nonConformities: () => Promise.resolve(Buffer.from('PK no conformidades')),
  results: () => Promise.resolve(Buffer.from('PK resultados')),
};

const appFor = (role: Role) =>
  createApp({
    authService: new RoleAuth(role),
    reportsService: new ReportsService(
      new EmptyReportsRepository(),
      () => new Date('2026-09-20T17:00:00.000Z'),
      new TraceabilityStub(),
      new ExportStub(),
      () => Promise.resolve(Buffer.from('%PDF-1.7 prueba')),
      excelRenderers,
    ),
  });
const bearer = { Authorization: 'Bearer prueba' };
const path = `${env.API_PREFIX}/reports/dashboard?dateFrom=2026-09-01&dateTo=2026-09-30`;
const batchId = '22222222-2222-4222-a222-222222222222';

describe('rutas de indicadores', () => {
  it('entrega el contrato consolidado a un usuario autenticado', async () => {
    const response = await request(appFor('OPERARIO'))
      .get(path)
      .set(bearer)
      .expect(200);
    expect(
      ReportsDashboardResponseSchema.safeParse(response.body).success,
    ).toBe(true);
  });

  it('rechaza un periodo invertido y el acceso sin token', async () => {
    const invalid = await request(appFor('ADMIN'))
      .get(
        `${env.API_PREFIX}/reports/dashboard?dateFrom=2026-10-01&dateTo=2026-09-30`,
      )
      .set(bearer)
      .expect(400);
    expect(ApiErrorSchema.parse(invalid.body).error.code).toBe(
      'VALIDATION_ERROR',
    );
    await request(appFor('ADMIN')).get(path).expect(401);
  });

  it('impide que el analista mezcle datos DEMO', async () => {
    const response = await request(appFor('ANALISTA'))
      .get(`${path}&includeDemo=true`)
      .set(bearer)
      .expect(403);
    expect(ApiErrorSchema.parse(response.body).error.code).toBe(
      'INSUFFICIENT_PERMISSIONS',
    );
  });
});

describe('ruta de reporte PDF', () => {
  it('entrega el PDF a roles autorizados y rechaza al operario', async () => {
    const pdfPath = `${env.API_PREFIX}/reports/traceability/${batchId}/pdf`;
    const response = await request(appFor('ANALISTA'))
      .get(pdfPath)
      .set(bearer)
      .expect(200);
    expect(response.headers['content-type']).toContain('application/pdf');
    expect(response.headers['content-disposition']).toContain(
      'trazabilidad-LT-2026-0001.pdf',
    );
    await request(appFor('OPERARIO')).get(pdfPath).set(bearer).expect(403);
  });
});

describe('rutas de reportes Excel', () => {
  it.each([
    ['inspections', 'inspecciones-202609201700.xlsx'],
    ['nonconformities', 'no-conformidades-202609201700.xlsx'],
    ['results', 'resultados-202609201700.xlsx'],
  ])('entrega %s como XLSX', async (report, fileName) => {
    const response = await request(appFor('ANALISTA'))
      .get(`${env.API_PREFIX}/reports/${report}/excel`)
      .set(bearer)
      .expect(200);
    expect(response.headers['content-type']).toContain(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(response.headers['content-disposition']).toContain(fileName);
  });

  it('rechaza al operario y el uso de DEMO por un analista', async () => {
    const excelPath = `${env.API_PREFIX}/reports/inspections/excel`;
    await request(appFor('OPERARIO')).get(excelPath).set(bearer).expect(403);
    await request(appFor('ANALISTA'))
      .get(`${excelPath}?includeDemo=true`)
      .set(bearer)
      .expect(403);
  });
});
