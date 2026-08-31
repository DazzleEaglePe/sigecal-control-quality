import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { ComponentProps } from 'react';

import { cn } from '../../lib/utils.js';

export const Dialog = (
  props: ComponentProps<typeof DialogPrimitive.Root>,
): React.JSX.Element => <DialogPrimitive.Root {...props} />;

export const DialogTitle = (
  props: ComponentProps<typeof DialogPrimitive.Title>,
): React.JSX.Element => <DialogPrimitive.Title {...props} />;

export const DialogDescription = (
  props: ComponentProps<typeof DialogPrimitive.Description>,
): React.JSX.Element => <DialogPrimitive.Description {...props} />;

export const DialogOverlay = ({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Overlay>): React.JSX.Element => (
  <DialogPrimitive.Overlay
    className={cn('fixed inset-0 z-50 bg-background/70', className)}
    {...props}
  />
);

export const DialogContent = ({
  children,
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content>): React.JSX.Element => (
  <DialogPrimitive.Portal>
    <DialogOverlay />
    <DialogPrimitive.Content
      className={cn(
        'fixed top-[18vh] left-1/2 z-50 w-[min(92vw,34rem)] -translate-x-1/2 rounded-xl border border-border bg-popover text-popover-foreground outline-none',
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
);
