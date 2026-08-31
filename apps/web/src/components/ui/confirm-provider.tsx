import { useCallback, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from './alert-dialog.js';
import {
  ConfirmContext,
  type Confirm,
  type ConfirmOptions,
} from './confirm-context.js';

const ConfirmationActions = ({
  options,
  settle,
}: {
  readonly options: ConfirmOptions | undefined;
  readonly settle: (confirmed: boolean) => void;
}): React.JSX.Element => (
  <div className="confirm-dialog-actions">
    <AlertDialogCancel
      onClick={() => {
        settle(false);
      }}
    >
      {options?.cancelLabel ?? 'Cancelar'}
    </AlertDialogCancel>
    <AlertDialogAction
      destructive={Boolean(options?.destructive)}
      onClick={() => {
        settle(true);
      }}
    >
      {options?.confirmLabel ?? 'Confirmar'}
    </AlertDialogAction>
  </div>
);

const ConfirmationDialog = ({
  options,
  settle,
}: {
  readonly options: ConfirmOptions | undefined;
  readonly settle: (confirmed: boolean) => void;
}): React.JSX.Element => (
  <AlertDialog
    open={Boolean(options)}
    onOpenChange={(open) => {
      if (!open) settle(false);
    }}
  >
    <AlertDialogContent>
      <div className="confirm-dialog-heading">
        <span aria-hidden="true">
          <AlertTriangle />
        </span>
        <div>
          <AlertDialogTitle>{options?.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {options?.description}
          </AlertDialogDescription>
        </div>
      </div>
      <ConfirmationActions options={options} settle={settle} />
    </AlertDialogContent>
  </AlertDialog>
);

export const ConfirmProvider = ({
  children,
}: {
  readonly children: React.ReactNode;
}): React.JSX.Element => {
  const [options, setOptions] = useState<ConfirmOptions>();
  const resolver = useRef<(confirmed: boolean) => void>(undefined);
  const confirm = useCallback<Confirm>((next) => {
    resolver.current?.(false);
    setOptions(next);
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, []);
  const settle = (confirmed: boolean): void => {
    resolver.current?.(confirmed);
    resolver.current = undefined;
    setOptions(undefined);
  };
  return (
    <ConfirmContext value={confirm}>
      {children}
      <ConfirmationDialog options={options} settle={settle} />
    </ConfirmContext>
  );
};
