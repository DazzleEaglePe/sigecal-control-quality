import { useState, type SyntheticEvent } from 'react';

import { errorMessage } from '../admin/admin-ui.js';
import { useAuth } from '../auth/useAuth.js';
import {
  createCatalogItem,
  type CatalogItem,
  type CatalogKind,
} from './catalog-api.js';
import { catalogInputFrom, catalogLabels } from './catalog-config.js';

const DescriptionField = (): React.JSX.Element => (
  <label className="form-span">
    Descripción opcional
    <input name="description" maxLength={500} />
  </label>
);

const OrderedFields = (): React.JSX.Element => (
  <>
    <label>
      Secuencia
      <input name="sequence" type="number" min="1" max="999" required />
    </label>
    <DescriptionField />
  </>
);

const EquipmentFields = (): React.JSX.Element => (
  <>
    <label>
      Estado operativo
      <select name="status" defaultValue="OPERATIVO">
        <option value="OPERATIVO">Operativo</option>
        <option value="EN_MANTENIMIENTO">En mantenimiento</option>
        <option value="FUERA_DE_SERVICIO">Fuera de servicio</option>
      </select>
    </label>
    <label>
      Referencia de calibración
      <input name="lastCalibrationRef" maxLength={160} />
    </label>
  </>
);

const ParameterFields = (): React.JSX.Element => (
  <>
    <label>
      Unidad
      <input name="unit" required maxLength={40} placeholder="Ej. % v/v" />
    </label>
    <label>
      Tipo
      <select name="type" defaultValue="FISICOQUIMICO">
        <option value="FISICOQUIMICO">Fisicoquímico</option>
        <option value="SENSORIAL">Sensorial</option>
      </select>
    </label>
    <label>
      Decimales
      <input name="decimals" type="number" min="0" max="6" defaultValue="2" />
    </label>
    <label>
      Método de ensayo
      <input name="testMethod" maxLength={160} />
    </label>
  </>
);

const SpecificFields = ({
  kind,
}: {
  readonly kind: CatalogKind;
}): React.JSX.Element | null => {
  if (kind === 'pisco-types') return <DescriptionField />;
  if (kind === 'stages' || kind === 'sensory-attributes') {
    return <OrderedFields />;
  }
  if (kind === 'equipment') return <EquipmentFields />;
  if (kind === 'parameters') return <ParameterFields />;
  return null;
};

const useCatalogForm = (
  kind: CatalogKind,
  added: (item: CatalogItem) => void,
) => {
  const { request } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const submit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setError(undefined);
    try {
      added(
        await createCatalogItem(request, kind, catalogInputFrom(kind, form)),
      );
      form.reset();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, submit };
};

export const CatalogForm = ({
  kind,
  added,
}: {
  readonly kind: CatalogKind;
  readonly added: (item: CatalogItem) => void;
}): React.JSX.Element => {
  const form = useCatalogForm(kind, added);
  return (
    <form className="admin-form" onSubmit={(event) => void form.submit(event)}>
      {form.error ? <p className="form-error form-span">{form.error}</p> : null}
      <label>
        Código
        <input name="code" required maxLength={40} placeholder="EJ. CODIGO" />
      </label>
      <label>
        Nombre
        <input name="name" required maxLength={120} />
      </label>
      <SpecificFields kind={kind} />
      <button className="primary-button form-span" disabled={form.busy}>
        {form.busy ? 'Guardando…' : `Crear en ${catalogLabels[kind]}`}
      </button>
    </form>
  );
};
