import type { LucideIcon } from 'lucide-react';

import { Card } from '../../components/ui/card.js';

export interface StatCardProps {
  readonly hint: string;
  readonly icon: LucideIcon;
  readonly label: string;
  readonly loading: boolean;
  readonly value: number | string;
}

export const StatCard = ({
  hint,
  icon: Icon,
  label,
  loading,
  value,
}: StatCardProps): React.JSX.Element => (
  <Card className="gap-0 py-5">
    <div className="flex items-center justify-between gap-3 px-5">
      <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
      <Icon
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
    </div>
    <div className="px-5 pt-4">
      {loading ? (
        <span className="block h-9 w-16 animate-pulse rounded bg-muted" />
      ) : (
        <strong className="block text-4xl font-medium tracking-tight tabular-nums">
          {value}
        </strong>
      )}
      <p className="pt-1.5 text-xs text-muted-foreground">{hint}</p>
    </div>
  </Card>
);
