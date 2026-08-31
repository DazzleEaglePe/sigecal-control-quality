import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import type { ComponentProps } from 'react';

import { cn } from '../../lib/utils.js';

export const DropdownMenu = (
  props: ComponentProps<typeof DropdownMenuPrimitive.Root>,
): React.JSX.Element => <DropdownMenuPrimitive.Root {...props} />;

export const DropdownMenuTrigger = (
  props: ComponentProps<typeof DropdownMenuPrimitive.Trigger>,
): React.JSX.Element => <DropdownMenuPrimitive.Trigger {...props} />;

export const DropdownMenuGroup = (
  props: ComponentProps<typeof DropdownMenuPrimitive.Group>,
): React.JSX.Element => <DropdownMenuPrimitive.Group {...props} />;

export const DropdownMenuContent = ({
  className,
  sideOffset = 8,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Content>): React.JSX.Element => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      sideOffset={sideOffset}
      className={cn(
        'z-50 min-w-[13rem] overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-none',
        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
);

export const DropdownMenuItem = ({
  className,
  variant = 'default',
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  readonly variant?: 'default' | 'destructive';
}): React.JSX.Element => (
  <DropdownMenuPrimitive.Item
    data-variant={variant}
    className={cn(
      'flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-45 data-[highlighted]:bg-secondary data-[variant=destructive]:text-destructive data-[variant=destructive]:data-[highlighted]:bg-destructive/10 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground data-[variant=destructive]:[&_svg]:text-destructive',
      className,
    )}
    {...props}
  />
);

export const DropdownMenuLabel = ({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Label>): React.JSX.Element => (
  <DropdownMenuPrimitive.Label
    className={cn(
      'px-2.5 py-1.5 text-xs font-medium text-muted-foreground',
      className,
    )}
    {...props}
  />
);

export const DropdownMenuSeparator = ({
  className,
  ...props
}: ComponentProps<
  typeof DropdownMenuPrimitive.Separator
>): React.JSX.Element => (
  <DropdownMenuPrimitive.Separator
    className={cn('-mx-1 my-1 h-px bg-border', className)}
    {...props}
  />
);
