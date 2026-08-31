import type { LucideIcon } from 'lucide-react';
import { ListFilter } from 'lucide-react';

export const EmptyState = ({
  title,
  description,
  icon: Icon = ListFilter,
}: {
  readonly title: string;
  readonly description: string;
  readonly icon?: LucideIcon;
}): React.JSX.Element => (
  <div className="empty-state" role="status">
    <span aria-hidden="true">
      <Icon />
    </span>
    <div>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  </div>
);
