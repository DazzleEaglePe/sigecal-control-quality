import { useState } from 'react';
import { toast } from 'sonner';

import { errorMessage } from '../admin/admin-ui.js';
import { useAuth } from '../auth/useAuth.js';
import type { AuthorizedRequest } from '../auth/auth-context.js';
import { executeAction, verifyAction } from './nonconformities-api.js';

export const useActionOps = (completed: () => Promise<void>) => {
  const { request } = useAuth();
  const [busyId, setBusyId] = useState<string>();
  const run = async (
    id: string,
    operation: (request: AuthorizedRequest) => Promise<unknown>,
    successMessage: string,
  ) => {
    setBusyId(id);
    try {
      await operation(request);
      await completed();
      toast.success(successMessage);
    } catch (cause) {
      toast.error('No se pudo completar la acción', {
        description: errorMessage(cause),
      });
    } finally {
      setBusyId(undefined);
    }
  };
  return {
    busyId,
    execute: (id: string) =>
      run(id, (req) => executeAction(req, id), 'Acción ejecutada'),
    verify: (id: string, isEffective: boolean, verificationComment: string) =>
      run(
        id,
        (req) => verifyAction(req, id, { isEffective, verificationComment }),
        isEffective
          ? 'Acción verificada como eficaz'
          : 'Acción marcada como no eficaz',
      ),
  };
};
