import { ClipboardCheck, PackageSearch, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { SearchResponseData, SearchResult } from '@sigecal/shared';

import { Badge } from '../../components/ui/badge.js';

const pathFor = (item: SearchResult): string => {
  if (item.type === 'BATCH') return `/lotes/${item.id}`;
  if (item.type === 'INSPECTION') return `/inspecciones/${item.id}`;
  return `/no-conformidades/${item.id}`;
};

const ResultList = ({ items }: { readonly items: readonly SearchResult[] }) => (
  <div className="grid gap-2">
    {items.map((item) => (
      <Link
        className="flex items-center justify-between gap-4 rounded-lg border border-border p-3 transition-colors hover:bg-secondary/60"
        key={`${item.type}-${item.id}`}
        to={pathFor(item)}
      >
        <span className="min-w-0">
          <strong className="block">{item.code}</strong>
          <small className="block truncate text-muted-foreground">
            {item.context}
          </small>
        </span>
        <Badge variant="outline">{item.status.replaceAll('_', ' ')}</Badge>
      </Link>
    ))}
  </div>
);

const Group = ({
  icon: Icon,
  items,
  title,
}: {
  readonly icon: typeof PackageSearch;
  readonly items: readonly SearchResult[];
  readonly title: string;
}) => {
  if (items.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <Icon className="size-4 text-primary" aria-hidden="true" /> {title}
      </h2>
      <ResultList items={items} />
    </section>
  );
};

export const SearchRecordGroups = ({
  data,
}: {
  readonly data: SearchResponseData;
}): React.JSX.Element => (
  <div className="grid gap-6">
    <Group icon={PackageSearch} title="Lotes" items={data.batches} />
    <Group
      icon={ClipboardCheck}
      title="Inspecciones"
      items={data.inspections}
    />
    <Group
      icon={TriangleAlert}
      title="No conformidades"
      items={data.nonConformities}
    />
  </div>
);
