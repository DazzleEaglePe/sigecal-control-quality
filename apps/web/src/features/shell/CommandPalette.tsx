import { Search } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../../components/ui/dialog.js';
import { useAuth } from '../auth/useAuth.js';
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

export const CommandPalette = ({
  open,
  setOpen,
}: CommandPaletteProps): React.JSX.Element => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const results = useResults(query);
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
        <PaletteResults focused={focused} go={go} results={results} />
      </DialogContent>
    </Dialog>
  );
};
