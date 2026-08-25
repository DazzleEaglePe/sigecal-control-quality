import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import {
  AuthContext,
  type AuthContextValue,
} from '../features/auth/auth-context.js';
import { LoginPage } from './LoginPage.js';

const authValue = (
  signIn: AuthContextValue['signIn'] = vi.fn(),
): AuthContextValue => ({
  status: 'anonymous',
  signIn,
  signOut: vi.fn(),
  updatePassword: vi.fn(),
  clearNotice: vi.fn(),
  request: vi.fn(),
  requestText: vi.fn(),
});

const renderLogin = (value: AuthContextValue): void => {
  render(
    <AuthContext value={value}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </AuthContext>,
  );
};

describe('LoginPage', () => {
  it('permite mostrar y volver a ocultar la contraseña', () => {
    renderLogin(authValue());
    const password = screen.getByLabelText('Contraseña');
    expect(password).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(password).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));
    expect(password).toHaveAttribute('type', 'password');
  });

  it('envía las credenciales institucionales', async () => {
    const signIn = vi.fn().mockResolvedValue(undefined);
    renderLogin(authValue(signIn));
    fireEvent.change(screen.getByLabelText('Correo institucional'), {
      target: { value: 'analista@sigecal.demo' },
    });
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'Segura2026' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar a SIGECAL' }));

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith({
        email: 'analista@sigecal.demo',
        password: 'Segura2026',
      });
    });
  });
});
