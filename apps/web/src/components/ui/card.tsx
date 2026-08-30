import type { ComponentProps } from 'react';

import { cn } from '../../lib/utils.js';

export const Card = ({
  className,
  ...props
}: ComponentProps<'div'>): React.JSX.Element => (
  <div
    data-slot="card"
    className={cn(
      'flex flex-col gap-6 rounded-xl border border-border bg-card py-6 text-card-foreground',
      className,
    )}
    {...props}
  />
);

export const CardHeader = ({
  className,
  ...props
}: ComponentProps<'div'>): React.JSX.Element => (
  <div
    data-slot="card-header"
    className={cn('flex flex-col gap-1.5 px-6', className)}
    {...props}
  />
);

export const CardTitle = ({
  className,
  ...props
}: ComponentProps<'div'>): React.JSX.Element => (
  <div
    data-slot="card-title"
    className={cn('font-semibold leading-none tracking-tight', className)}
    {...props}
  />
);

export const CardDescription = ({
  className,
  ...props
}: ComponentProps<'div'>): React.JSX.Element => (
  <div
    data-slot="card-description"
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
);

export const CardContent = ({
  className,
  ...props
}: ComponentProps<'div'>): React.JSX.Element => (
  <div data-slot="card-content" className={cn('px-6', className)} {...props} />
);

export const CardFooter = ({
  className,
  ...props
}: ComponentProps<'div'>): React.JSX.Element => (
  <div
    data-slot="card-footer"
    className={cn('flex items-center px-6', className)}
    {...props}
  />
);
