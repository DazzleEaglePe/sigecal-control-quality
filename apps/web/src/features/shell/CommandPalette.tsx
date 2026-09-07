import {
  ClipboardCheck,
  PackageSearch,
  Search,
  TriangleAlert,
} from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SearchResponseData, SearchResult } from '@sigecal/shared';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../../components/ui/dialog.js';
import { useAuth } from '../auth/useAuth.js';
import { useGlobalSearch } from '../discovery/useGlobalSearch.js';
import {
  SEARCH_DESTINATIONS,
  type SearchDestination,
} from './searchDestinations.js';

export interface CommandPaletteProps {
  readonly open: boolean;
  readonly setOpen: (open: boolean) => void;
}

const useResults = (query: string): readonly SearchDestination[] => {
  const { user } = useAuth();
  const term = query.trim().toLowerCase();
  return SEARCH_DESTINATIONS.filter(
    (item) => !item.permission || user?.permissions.includes(item.permission),
  ).filter((item) => item.label.toLowerCase().includes(term));
};

const useKeyboardNav = (
  resultsCount: number,
  activate: (index: number) => void,
) => {
  const [rawIndex, setRawIndex] = useState(0);
  const focused = resultsCount === 0 ? -1 : rawIndex % resultsCount;
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (resultsCount === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setRawIndex((current) => (current + 1) % resultsCount);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setRawIndex((current) => (current - 1 + resultsCount) % resultsCount);
    } else if (event.key === 'Enter') {
      activate(focused);
    }
  };
  return { focused, onKeyDown };
};

const PaletteInput = ({
  onKeyDown,
  query,
  setQuery,
}: {
  readonly onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  readonly query: string;
  readonly setQuery: (value: string) => void;
}): React.JSX.Element => (
  <div className="flex items-center gap-2.5 border-b border-border px-4 py-3.5">
    <Search className="size-4 text-muted-foreground" aria-hidden="true" />
    <input
      autoFocus
      value={query}
      placeholder="Buscar un módulo…"
      className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      onChange={(event) => {
        setQuery(event.target.value);
      }}
      onKeyDown={onKeyDown}
    />
    <kbd className="rounded border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
      Esc
    </kbd>
  </div>
);

const PaletteResults = ({
  focused,
  go,
  results,
}: {
  readonly focused: number;
  readonly go: (to: string) => void;
  readonly results: readonly SearchDestination[];
}): React.JSX.Element => (
  <div className="max-h-80 overflow-y-auto p-1.5" role="listbox">
    {results.length === 0 ? (
      <p className="px-3 py-6 text-center text-sm text-muted-foreground">
        Sin resultados.
      </p>
    ) : (
      results.map((item, index) => (
        <button
          type="button"
          className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm outline-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground ${index === focused ? 'bg-secondary' : ''}`}
          key={item.to}
          onClick={() => {
            go(item.to);
          }}
        >
          <item.icon aria-hidden="true" />
          <span>{item.label}</span>
        </button>
      ))
    )}
  </div>
);

const recordPath = (item: SearchResult): string => {
  if (item.type === 'BATCH') return `/lotes/${item.id}`;
  if (item.type === 'INSPECTION') return `/inspecciones/${item.id}`;
  return `/no-conformidades/${item.id}`;
};
const RecordButton = ({
  go,
  icon: Icon,
  item,
}: {
  readonly go: (to: string) => void;
  readonly icon: typeof PackageSearch;
  readonly item: SearchResult;
}) => (
  <button
    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm hover:bg-secondary"
    type="button"
    onClick={() => {
      go(recordPath(item));
    }}
  >
    <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
    <span className="min-w-0 flex-1">
      <strong className="block">{item.code}</strong>
      <small className="block truncate text-muted-foreground">
        {item.context}
      </small>
    </span>
    <small className="text-muted-foreground">
      {item.status.replaceAll('_', ' ')}
    </small>
  </button>
);

const RecordGroup = ({
  go,
  icon: Icon,
  items,
  title,
}: {
  readonly go: (to: string) => void;
  readonly icon: typeof PackageSearch;
  readonly items: readonly SearchResult[];
  readonly title: string;
}) => {
  if (items.length === 0) return null;
  return (
    <section className="border-t border-border p-1.5">
      <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {items.map((item) => (
        <RecordButton
          key={`${item.type}-${item.id}`}
          go={go}
          icon={Icon}
          item={item}
        />
      ))}
    </section>
  );
};

const RecordResults = ({
  data,
  go,
  loading,
}: {
  readonly data: SearchResponseData;
  readonly go: (to: string) => void;
  readonly loading: boolean;
}) => (
  <div>
    {loading ? (
      <p className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
        Buscando registros…
      </p>
    ) : null}
    <RecordGroup
      go={go}
      icon={PackageSearch}
      title="Lotes"
      items={data.batches}
    />
    <RecordGroup
      go={go}
      icon={ClipboardCheck}
      title="Inspecciones"
      items={data.inspections}
    />
    <RecordGroup
      go={go}
      icon={TriangleAlert}
      title="No conformidades"
      items={data.nonConformities}
    />
  </div>
);

export const CommandPalette = ({
  open,
  setOpen,
}: CommandPaletteProps): React.JSX.Element => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const results = useResults(query);
  const { request } = useAuth();
  const records = useGlobalSearch(request, query, undefined, 4);
  const go = (to: string): void => {
    void navigate(to);
    setOpen(false);
  };
  const { focused, onKeyDown } = useKeyboardNav(results.length, (index) => {
    const target = results[index];
    if (target) go(target.to);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0">
        <DialogTitle className="sr-only">Búsqueda global</DialogTitle>
        <DialogDescription className="sr-only">
          Escriba para buscar un módulo y presione Enter para abrirlo.
        </DialogDescription>
        <PaletteInput onKeyDown={onKeyDown} query={query} setQuery={setQuery} />
        <div className="max-h-96 overflow-y-auto">
          <PaletteResults focused={focused} go={go} results={results} />
          {query.trim().length >= 2 ? (
            <RecordResults
              data={records.data}
              go={go}
              loading={records.loading}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};
