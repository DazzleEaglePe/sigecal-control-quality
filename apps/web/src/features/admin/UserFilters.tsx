import type { ChangeEvent } from 'react';

import type { Role } from '@sigecal/shared';

export interface UserFilterValue {
  readonly search: string;
  readonly role: Role | '';
  readonly isActive: '' | 'true' | 'false';
}

interface FilterProps {
  readonly value: UserFilterValue;
  readonly change: (value: UserFilterValue) => void;
}

const SearchFilter = ({ value, change }: FilterProps): React.JSX.Element => {
  const update = (event: ChangeEvent<HTMLInputElement>): void => {
    change({ ...value, search: event.target.value });
  };
  return (
    <label>
      Buscar
      <input
        type="search"
        value={value.search}
        placeholder="Nombre o correo"
        onChange={update}
      />
    </label>
  );
};

const RoleFilter = ({ value, change }: FilterProps): React.JSX.Element => {
  const update = (event: ChangeEvent<HTMLSelectElement>): void => {
    change({ ...value, role: event.target.value as Role | '' });
  };
  return (
    <label>
      Rol
      <select value={value.role} onChange={update}>
        <option value="">Todos</option>
        <option value="ADMIN">Administrador</option>
        <option value="JEFE_CALIDAD">Jefe de calidad</option>
        <option value="ANALISTA">Analista</option>
        <option value="OPERARIO">Operario</option>
      </select>
    </label>
  );
};

const StatusFilter = ({ value, change }: FilterProps): React.JSX.Element => {
  const update = (event: ChangeEvent<HTMLSelectElement>): void => {
    change({
      ...value,
      isActive: event.target.value as UserFilterValue['isActive'],
    });
  };
  return (
    <label>
      Estado
      <select value={value.isActive} onChange={update}>
        <option value="">Todos</option>
        <option value="true">Activos</option>
        <option value="false">Inactivos</option>
      </select>
    </label>
  );
};

export const UserFilters = (props: FilterProps): React.JSX.Element => (
  <div className="account-filters" aria-label="Filtros de usuarios">
    <SearchFilter {...props} />
    <RoleFilter {...props} />
    <StatusFilter {...props} />
  </div>
);
