import { describe, expect, it } from 'vitest';

import type {
  AreaListQuery,
  CreateAreaRequest,
  UpdateAreaRequest,
} from '@sigecal/shared';

import { AreasService } from './areas.service.js';
import type { AreaRecord, AreaRepositoryPort } from './areas.types.js';

const area = (): AreaRecord => ({
  id: '22222222-2222-4222-a222-222222222222',
  code: 'CALIDAD',
  name: 'Calidad',
  isActive: true,
  isProvisional: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

class MemoryAreas implements AreaRepositoryPort {
  public records: AreaRecord[] = [area()];
  public activeUsers = 0;
  public list(_query: AreaListQuery) {
    void _query;
    return Promise.resolve(this.records);
  }
  public findById(id: string) {
    return Promise.resolve(this.records.find((item) => item.id === id) ?? null);
  }
  public findByCode(code: string) {
    return Promise.resolve(
      this.records.find((item) => item.code === code) ?? null,
    );
  }
  public countActiveUsers() {
    return Promise.resolve(this.activeUsers);
  }
  public create(input: CreateAreaRequest) {
    const created = {
      ...area(),
      ...input,
      id: '33333333-3333-4333-a333-333333333333',
    };
    this.records.push(created);
    return Promise.resolve(created);
  }
  public update(id: string, input: UpdateAreaRequest) {
    const current = this.records.find((item) => item.id === id) ?? area();
    const updated: AreaRecord = {
      ...current,
      code: input.code ?? current.code,
      name: input.name ?? current.name,
      isActive: input.isActive ?? current.isActive,
      isProvisional: input.isProvisional ?? current.isProvisional,
    };
    return Promise.resolve(updated);
  }
}

describe('AreasService', () => {
  it('bloquea la desactivación si conserva usuarios activos', async () => {
    const repository = new MemoryAreas();
    repository.activeUsers = 2;
    await expect(
      new AreasService(repository).update(
        area().id,
        { isActive: false },
        'actor',
      ),
    ).rejects.toMatchObject({ code: 'RESOURCE_IN_USE' });
  });

  it('rechaza códigos duplicados y conserva provisional por defecto', async () => {
    const repository = new MemoryAreas();
    const service = new AreasService(repository);
    await expect(
      service.create(
        { code: 'CALIDAD', name: 'Otra', isProvisional: true },
        'actor',
      ),
    ).rejects.toMatchObject({ code: 'CODE_IN_USE' });
    const created = await service.create(
      { code: 'NUEVA', name: 'Nueva', isProvisional: true },
      'actor',
    );
    expect(created.isProvisional).toBe(true);
  });
});
