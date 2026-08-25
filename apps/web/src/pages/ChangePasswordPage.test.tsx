import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  AuthContext,
  type AuthContextValue,
} from '../features/auth/auth-context.js';
import { ChangePasswordPage } from './ChangePasswordPage.js';

const authValue = (signOut: AuthContextValue['signOut']): AuthContextValue => ({
  status: 'authenticated',
  signIn: vi.fn(),
  signOut,
  updatePassword: vi.fn(),
  clearNotice: vi.fn(),
  request: vi.fn(),
  requestText: vi.fn(),
});

describe('ChangePasswordPage', () => {
  it('permite cerrar una sesión con contraseña provisional', async () => {
    const signOut = vi.fn().mockResolvedValue(undefined);
    render(
      <AuthContext value={authValue(signOut)}>
        <ChangePasswordPage />
      </AuthContext>,
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Cerrar sesión y usar otra cuenta',
      }),
    );

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledOnce();
    });
  });
});
