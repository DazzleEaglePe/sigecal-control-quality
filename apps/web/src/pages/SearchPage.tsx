import { Search } from 'lucide-react';
import { useMemo, useState, type SyntheticEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { SearchResponseData, SearchType } from '@sigecal/shared';

import { Card, CardContent } from '../components/ui/card.js';
import { EmptyState } from '../components/ui/empty-state.js';
import { Input } from '../components/ui/input.js';
import { NativeSelect } from '../components/ui/native-select.js';
import { useAuth } from '../features/auth/useAuth.js';
import { SearchRecordGroups } from '../features/discovery/SearchRecordGroups.js';
import { useGlobalSearch } from '../features/discovery/useGlobalSearch.js';

const typeFrom = (value: string | null): SearchType | undefined =>
  value === 'BATCH' || value === 'INSPECTION' || value === 'NONCONFORMITY'
    ? value
    : undefined;

const SearchHeader = () => (
  <header className="page-heading">
    <div>
      <p className="eyebrow">Consulta transversal</p>
      <h1>Búsqueda global</h1>
      <p>Solo aparecen registros permitidos para su rol y pertenencia.</p>
    </div>
    <Search className="size-10 text-primary" aria-hidden="true" />
  </header>
);

interface SearchFormProps {
  readonly activeType: SearchType | undefined;
  readonly draft: string;
  readonly changeDraft: (value: string) => void;
  readonly changeType: (value: string) => void;
  readonly submit: (event: SyntheticEvent<HTMLFormElement>) => void;
}

const SearchForm = (props: SearchFormProps) => (
  <Card>
    <CardContent className="pt-5">
      <form
        className="grid gap-3 md:grid-cols-[1fr_15rem_auto]"
        onSubmit={props.submit}
      >
        <Input
          aria-label="Texto de búsqueda"
          minLength={2}
          placeholder="Código, lote o descripción…"
          value={props.draft}
          onChange={(event) => {
            props.changeDraft(event.target.value);
          }}
        />
        <NativeSelect
          aria-label="Tipo de registro"
          value={props.activeType ?? ''}
          onChange={(event) => {
            props.changeType(event.target.value);
          }}
        >
          <option value="">Todos los tipos</option>
          <option value="BATCH">Lotes</option>
          <option value="INSPECTION">Inspecciones</option>
          <option value="NONCONFORMITY">No conformidades</option>
        </NativeSelect>
        <button className="primary-button" type="submit">
          Buscar
        </button>
      </form>
    </CardContent>
  </Card>
);

const SearchFeedback = ({
  data,
  error,
  loading,
  query,
}: {
  readonly data: SearchResponseData;
  readonly error: string | undefined;
  readonly loading: boolean;
  readonly query: string;
}) => (
  <>
    {error ? <p className="form-error">{error}</p> : null}
    {loading ? <p>Cargando resultados…</p> : null}
    {!loading && query.length < 2 ? (
      <EmptyState
        title="Ingrese al menos dos caracteres"
        description="Puede buscar por código de lote, inspección o no conformidad."
      />
    ) : null}
    {!loading && query.length >= 2 && data.total === 0 ? (
      <EmptyState
        title="Sin resultados accesibles"
        description="Revise el texto o cambie el tipo de registro."
      />
    ) : null}
    {data.total > 0 ? <SearchRecordGroups data={data} /> : null}
  </>
);

const useSearchState = () => {
  const [params, setParams] = useSearchParams();
  const activeQuery = params.get('q') ?? '';
  const activeType = typeFrom(params.get('type'));
  const [draft, setDraft] = useState(activeQuery);
  const update = (key: string, value: string): void => {
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    });
  };
  return { activeQuery, activeType, draft, setDraft, update };
};

export const SearchPage = (): React.JSX.Element => {
  const { request } = useAuth();
  const search = useSearchState();
  const types = useMemo(
    () => (search.activeType ? [search.activeType] : undefined),
    [search.activeType],
  );
  const result = useGlobalSearch(request, search.activeQuery, types, 20);
  return (
    <div className="space-y-5">
      <SearchHeader />
      <SearchForm
        activeType={search.activeType}
        draft={search.draft}
        changeDraft={search.setDraft}
        changeType={(value) => {
          search.update('type', value);
        }}
        submit={(event) => {
          event.preventDefault();
          search.update('q', search.draft.trim());
        }}
      />
      <SearchFeedback
        data={result.data}
        error={result.error}
        loading={result.loading}
        query={search.activeQuery}
      />
    </div>
  );
};
