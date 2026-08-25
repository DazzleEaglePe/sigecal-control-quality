import { describe, expect, it } from 'vitest';

import type { CatalogListQuery } from '@sigecal/shared';

import { CatalogsService } from './catalogs.service.js';
import type {
  CatalogCreateInput,
  CatalogItem,
  CatalogKind,
  CatalogRepositoryPort,
  CatalogUpdateInput,
} from './catalogs.types.js';

const variety: CatalogItem = {
  id: '11111111-1111-4111-a111-111111111111',
  code: 'QUEBRANTA',
  name: 'Quebranta',
  isActive: true,
};
const stage: CatalogItem = {
  id: '22222222-2222-4222-a222-222222222222',
  code: 'FERMENTACION',
  name: 'Fermentación',
  sequence: 3,
  description: null,
  isActive: true,
};

class MemoryCatalogs implements CatalogRepositoryPort {
  public items: CatalogItem[] = [];
  public references = 0;
  public list(_kind: CatalogKind, _query: CatalogListQuery) {
    void _kind;
    void _query;
    return Promise.resolve(this.items);
  }
  public findById(_kind: CatalogKind, id: string) {
    void _kind;
    return Promise.resolve(this.items.find((item) => item.id === id) ?? null);
  }
  public findByCode(_kind: CatalogKind, code: string) {
    void _kind;
    return Promise.resolve(
      this.items.find((item) => item.code === code) ?? null,
    );
  }
  public findBySequence(_kind: CatalogKind, sequence: number) {
    void _kind;
    return Promise.resolve(
      this.items.find(
        (item) => 'sequence' in item && item.sequence === sequence,
      ) ?? null,
    );
  }
  public countReferences(_kind: CatalogKind, _id: string) {
    void _kind;
    void _id;
    return Promise.resolve(this.references);
  }
  public create(_kind: CatalogKind, input: CatalogCreateInput) {
    void _kind;
    return Promise.resolve({ ...variety, ...input });
  }
  public update(_kind: CatalogKind, id: string, input: CatalogUpdateInput) {
    void _kind;
    const current = this.items.find((item) => item.id === id) ?? variety;
    return Promise.resolve({ ...current, ...input } as CatalogItem);
  }
}

describe('CatalogsService', () => {
  it('rechaza códigos duplicados sin depender de la base de datos', async () => {
    const repository = new MemoryCatalogs();
    repository.items = [variety];
    await expect(
      new CatalogsService(repository).create(
        'varieties',
        { code: 'QUEBRANTA', name: 'Duplicada' },
        'actor',
      ),
    ).rejects.toMatchObject({ code: 'CODE_IN_USE' });
  });

  it('protege el orden único de etapas y atributos sensoriales', async () => {
    const repository = new MemoryCatalogs();
    repository.items = [stage];
    await expect(
      new CatalogsService(repository).create(
        'stages',
        { code: 'DESTILACION', name: 'Destilación', sequence: 3 },
        'actor',
      ),
    ).rejects.toMatchObject({ code: 'SEQUENCE_IN_USE' });
  });
});

describe('CatalogsService y baja lógica', () => {
  it('permite baja lógica y nunca ofrece eliminación física', async () => {
    const repository = new MemoryCatalogs();
    repository.items = [variety];
    const result = await new CatalogsService(repository).update(
      'varieties',
      variety.id,
      { isActive: false },
      'actor',
    );
    expect(result.isActive).toBe(false);
  });

  it('impide desactivar un catálogo utilizado por otros registros', async () => {
    const repository = new MemoryCatalogs();
    repository.items = [variety];
    repository.references = 1;
    await expect(
      new CatalogsService(repository).update(
        'varieties',
        variety.id,
        { isActive: false },
        'actor',
      ),
    ).rejects.toMatchObject({ code: 'RESOURCE_IN_USE' });
  });
});
