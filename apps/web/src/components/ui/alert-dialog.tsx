import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import type { ComponentProps } from 'react';

import { cn } from '../../lib/utils.js';
import { buttonVariants } from './button-variants.js';

export const AlertDialog = (
  props: ComponentProps<typeof AlertDialogPrimitive.Root>,
): React.JSX.Element => <AlertDialogPrimitive.Root {...props} />;

export const AlertDialogTitle = (
  props: ComponentProps<typeof AlertDialogPrimitive.Title>,
): React.JSX.Element => <AlertDialogPrimitive.Title {...props} />;

export const AlertDialogDescription = (
  props: ComponentProps<typeof AlertDialogPrimitive.Description>,
): React.JSX.Element => <AlertDialogPrimitive.Description {...props} />;

export const AlertDialogOverlay = ({
  className,
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Overlay>): React.JSX.Element => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm',
      className,
    )}
    {...props}
  />
);

export const AlertDialogContent = ({
  className,
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Content>): React.JSX.Element => (
  <AlertDialogPrimitive.Portal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      className={cn(
        'fixed top-1/2 left-1/2 z-50 grid w-[min(92vw,30rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border border-border bg-popover p-6 text-popover-foreground outline-none',
        className,
      )}
      {...props}
    />
  </AlertDialogPrimitive.Portal>
);

export const AlertDialogCancel = ({
  className,
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Cancel>): React.JSX.Element => (
  <AlertDialogPrimitive.Cancel
    className={cn(buttonVariants({ variant: 'outline' }), className)}
    {...props}
  />
);

export const AlertDialogAction = ({
  className,
  destructive = false,
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Action> & {
  readonly destructive?: boolean;
}): React.JSX.Element => (
  <AlertDialogPrimitive.Action
    className={cn(
      buttonVariants({ variant: destructive ? 'destructive' : 'default' }),
      className,
    )}
    {...props}
  />
);
