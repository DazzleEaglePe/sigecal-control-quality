import type { ComponentProps } from 'react';

import { cn } from '../../lib/utils.js';

export const Table = ({
  className,
  ...props
}: ComponentProps<'table'>): React.JSX.Element => (
  <table
    className={cn('w-full caption-bottom text-sm', className)}
    {...props}
  />
);

export const TableHeader = (
  props: ComponentProps<'thead'>,
): React.JSX.Element => <thead {...props} />;
export const TableBody = (
  props: ComponentProps<'tbody'>,
): React.JSX.Element => <tbody {...props} />;
export const TableRow = (props: ComponentProps<'tr'>): React.JSX.Element => (
  <tr {...props} />
);
export const TableHead = (props: ComponentProps<'th'>): React.JSX.Element => (
  <th scope="col" {...props} />
);
export const TableCell = (props: ComponentProps<'td'>): React.JSX.Element => (
  <td {...props} />
);
