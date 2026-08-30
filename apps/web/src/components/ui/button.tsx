import { Slot } from '@radix-ui/react-slot';
import type { VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

import { cn } from '../../lib/utils.js';
import { buttonVariants } from './button-variants.js';

export const Button = ({
  asChild = false,
  className,
  size,
  variant,
  ...props
}: ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    readonly asChild?: boolean;
  }): React.JSX.Element => {
  const Component = asChild ? Slot : 'button';
  return (
    <Component
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
};
