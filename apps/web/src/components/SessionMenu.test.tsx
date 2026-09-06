import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import type { UserSession } from '@sigecal/shared';

import {
  AuthContext,
  type AuthContextValue,
} from '../features/auth/auth-context.js';
import { SessionMenu } from './SessionMenu.js';

const user: UserSession = {
  id: '7fa14bd0-5f55-4b48-ad2c-5e833e6bcbb5',
  firstName: 'Nicolle',
  lastName: 'Calidad',
  email: 'nicolle@example.com',
  role: 'ADMIN',
  mustChangePassword: false,
  permissions: ['USERS_MANAGE'],
};

const authValue = (signOut: AuthContextValue['signOut']): AuthContextValue => ({
  status: 'authenticated',
  user,
  signIn: vi.fn(),
  signOut,
  updatePassword: vi.fn(),
  clearNotice: vi.fn(),
  request: vi.fn(),
  requestText: vi.fn(),
});

const openMenu = (): void => {
  fireEvent.pointerDown(
    screen.getByRole('button', {
      name: 'Abrir menú de cuenta de Nicolle Calidad',
    }),
    { button: 0, ctrlKey: false },
  );
};

describe('SessionMenu', () => {
  it('muestra la identidad completa y las acciones de la cuenta', async () => {
    render(
      <MemoryRouter>
        <AuthContext value={authValue(vi.fn())}>
          <SessionMenu />
        </AuthContext>
      </MemoryRouter>,
    );

    openMenu();

    expect(await screen.findByText('nicolle@example.com')).toBeInTheDocument();
    expect(screen.getAllByText('Administrador')).toHaveLength(2);
    expect(screen.getByText('Ajustes de cuenta')).toBeInTheDocument();
    expect(screen.getByText('Cambiar mi contraseña')).toBeInTheDocument();
  });

  it('cierra la sesión desde la acción diferenciada', async () => {
    const signOut = vi.fn().mockResolvedValue(undefined);
    render(
      <MemoryRouter>
        <AuthContext value={authValue(signOut)}>
          <SessionMenu />
        </AuthContext>
      </MemoryRouter>,
    );

    openMenu();
    fireEvent.click(await screen.findByText('Cerrar sesión'));

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledOnce();
    });
  });
});
