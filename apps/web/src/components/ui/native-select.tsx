import type { ComponentProps } from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '../../lib/utils.js';

export const NativeSelect = ({
  className,
  children,
  ...props
}: ComponentProps<'select'>): React.JSX.Element => (
  <span className="native-select-wrap">
    <select
      className={cn(
        'min-h-11 w-full appearance-none rounded-md border border-input bg-background py-2 pr-10 pl-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown aria-hidden="true" />
  </span>
);
