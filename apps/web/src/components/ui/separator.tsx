import type { ComponentProps } from 'react';

import { cn } from '../../lib/utils.js';

export const Separator = ({
  className,
  orientation = 'horizontal',
  ...props
}: ComponentProps<'div'> & {
  readonly orientation?: 'horizontal' | 'vertical';
}): React.JSX.Element => (
  <div
    data-slot="separator"
    role="none"
    className={cn(
      'shrink-0 bg-border',
      orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
      className,
    )}
    {...props}
  />
);
