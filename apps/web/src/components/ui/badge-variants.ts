import { cva } from 'class-variance-authority';

export const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold whitespace-nowrap [&_svg:not([class*='size-'])]:size-3 [&_svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'border-border bg-card text-muted-foreground',
        success: 'border-transparent bg-accent text-accent-foreground',
        destructive:
          'border-transparent bg-destructive/10 text-destructive dark:bg-destructive/20',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);
