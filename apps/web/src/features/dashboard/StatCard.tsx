import type { LucideIcon } from 'lucide-react';

import { Card } from '../../components/ui/card.js';

export interface StatCardProps {
  readonly hint: string;
  readonly icon: LucideIcon;
  readonly label: string;
  readonly loading: boolean;
  readonly value: number;
}

export const StatCard = ({
  hint,
  icon: Icon,
  label,
  loading,
  value,
}: StatCardProps): React.JSX.Element => (
  <Card className="gap-0 py-5">
    <div className="flex items-start justify-between gap-3 px-5">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
      <span
        className="grid size-8 place-items-center rounded-md border border-border bg-muted text-muted-foreground"
        aria-hidden="true"
      >
        <Icon className="size-4" />
      </span>
    </div>
    <div className="px-5 pt-3">
      {loading ? (
        <span className="block h-9 w-20 animate-pulse rounded bg-muted" />
      ) : (
        <strong className="block text-4xl font-semibold tracking-tight tabular-nums">
          {value}
        </strong>
      )}
      <p className="pt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  </Card>
);
