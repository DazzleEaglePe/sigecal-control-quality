import { use } from 'react';

import { AuthContext, type AuthContextValue } from './auth-context.js';

export const useAuth = (): AuthContextValue => {
  const context = use(AuthContext);
  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de AuthProvider.');
  }
  return context;
};
