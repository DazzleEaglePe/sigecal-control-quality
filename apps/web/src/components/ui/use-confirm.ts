import { useContext } from 'react';

import { ConfirmContext, type Confirm } from './confirm-context.js';

export const useConfirm = (): Confirm => {
  const confirm = useContext(ConfirmContext);
  if (!confirm)
    throw new Error('useConfirm debe utilizarse dentro de ConfirmProvider.');
  return confirm;
};
