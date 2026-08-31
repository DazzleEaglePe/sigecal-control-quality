import type { ComponentProps } from 'react';

import { cn } from '../../lib/utils.js';

export const Input = ({
  className,
  type = 'text',
  ...props
}: ComponentProps<'input'>): React.JSX.Element => (
  <input
    type={type}
    className={cn(
      'flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35 disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  />
);
