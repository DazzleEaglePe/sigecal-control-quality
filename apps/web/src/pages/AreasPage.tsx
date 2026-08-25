import { useEffect, useState, type SyntheticEvent } from 'react';

import { CreateAreaRequestSchema, type AreaItem } from '@sigecal/shared';

import {
  createArea,
  listAreas,
  setAreaStatus,
} from '../features/admin/admin-api.js';
import { errorMessage, fieldValue } from '../features/admin/admin-ui.js';
import { useAuth } from '../features/auth/useAuth.js';

const useAreasPage = () => {
  const { request } = useAuth();
  const [areas, setAreas] = useState<readonly AreaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  useEffect(() => {
    let active = true;
    void listAreas(request)
      .then((data) => {
        if (active) setAreas(data);
      })
      .catch((cause: unknown) => {
        if (active) setError(errorMessage(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [request]);
  const replace = (area: AreaItem): void => {
    setAreas((current) =>
      current.map((item) => (item.id === area.id ? area : item)),
    );
  };
  const add = (area: AreaItem): void => {
    setAreas((current) => [area, ...current]);
  };
  return { request, areas, loading, error, replace, add };
};

const useNewArea = (added: (area: AreaItem) => void) => {
  const { request } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const submit = async (
    event: SyntheticEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    const form = event.currentTarget;
    const parsed = CreateAreaRequestSchema.safeParse({
      code: fieldValue(form, 'code'),
      name: fieldValue(form, 'name'),
      isProvisional: true,
    });
    if (!parsed.success) {
      setError('Ingrese un código válido y el nombre del área.');
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      added(await createArea(request, parsed.data));
      form.reset();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, submit };
};

const NewAreaForm = ({
  added,
}: {
  readonly added: (area: AreaItem) => void;
}): React.JSX.Element => {
  const form = useNewArea(added);
  return (
    <form
      className="admin-form compact-form"
      onSubmit={(event) => void form.submit(event)}
    >
      {form.error ? (
        <p className="form-error form-span" role="alert">
          {form.error}
        </p>
      ) : null}
      <label>
        Código
        <input name="code" required maxLength={30} placeholder="EJ. CALIDAD" />
      </label>
      <label>
        Nombre
        <input name="name" required maxLength={100} />
      </label>
      <p className="field-help form-span">
        Las áreas nuevas quedan provisionales hasta ser confirmadas con la
        empresa.
      </p>
      <button
        className="primary-button form-span"
        type="submit"
        disabled={form.busy}
      >
        {form.busy ? 'Creando…' : 'Crear área provisional'}
      </button>
    </form>
  );
};

const useAreaToggle = (area: AreaItem, changed: (area: AreaItem) => void) => {
  const { request } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const toggle = async (): Promise<void> => {
    setBusy(true);
    setError(undefined);
    try {
      changed(await setAreaStatus(request, area));
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, toggle };
};

const AreaCard = ({
  area,
  changed,
}: {
  readonly area: AreaItem;
  readonly changed: (area: AreaItem) => void;
}): React.JSX.Element => {
  const status = useAreaToggle(area, changed);
  return (
    <article className="area-card">
      <div>
        <span className={`state-pill ${area.isActive ? 'is-active' : ''}`}>
          {area.isActive ? 'Activa' : 'Inactiva'}
        </span>
        {area.isProvisional ? (
          <span className="state-pill is-provisional">Provisional</span>
        ) : null}
      </div>
      <h3>{area.name}</h3>
      <p>{area.code}</p>
      <button
        className="secondary-button"
        type="button"
        onClick={() => void status.toggle()}
        disabled={status.busy}
      >
        {area.isActive ? 'Desactivar' : 'Activar'}
      </button>
      {status.error ? (
        <small className="inline-error">{status.error}</small>
      ) : null}
    </article>
  );
};

export const AreasPage = (): React.JSX.Element => {
  const page = useAreasPage();
  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Configuración</p>
          <h1>Áreas</h1>
          <p>
            Catálogo organizacional mínimo para responsables y trazabilidad.
          </p>
        </div>
      </header>
      <section className="admin-panel">
        <h2>Nueva área</h2>
        <NewAreaForm added={page.add} />
      </section>
      <section className="admin-panel">
        <h2>Áreas registradas</h2>
        {page.error ? (
          <p className="form-error" role="alert">
            {page.error}
          </p>
        ) : null}
        {page.loading ? (
          <p>Cargando áreas…</p>
        ) : (
          <div className="areas-grid">
            {page.areas.map((area) => (
              <AreaCard key={area.id} area={area} changed={page.replace} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
