import type { VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

import { cn } from '../../lib/utils.js';
import { badgeVariants } from './badge-variants.js';

export const Badge = ({
  className,
  variant,
  ...props
}: ComponentProps<'span'> &
  VariantProps<typeof badgeVariants>): React.JSX.Element => (
  <span
    data-slot="badge"
    className={cn(badgeVariants({ variant }), className)}
    {...props}
  />
);
