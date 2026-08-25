import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import type { UserSession } from '@sigecal/shared';

import { AuthContext, type AuthContextValue } from './auth-context.js';
import { ProtectedRoute } from './ProtectedRoute.js';

const user: UserSession = {
  id: '7fa14bd0-5f55-4b48-ad2c-5e833e6bcbb5',
  firstName: 'Ana',
  lastName: 'Paz',
  email: 'ana@example.com',
  role: 'ANALISTA',
  mustChangePassword: true,
  permissions: ['RESULTS_RECORD'],
};

const context = (value: Partial<AuthContextValue>): AuthContextValue => ({
  status: 'anonymous',
  signIn: vi.fn(),
  signOut: vi.fn(),
  updatePassword: vi.fn(),
  clearNotice: vi.fn(),
  request: vi.fn(),
  requestText: vi.fn(),
  ...value,
});

const renderRoute = (value: AuthContextValue): void => {
  render(
    <AuthContext value={value}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="login" element={<p>Ingreso</p>} />
          <Route element={<ProtectedRoute />}>
            <Route index element={<p>Tablero privado</p>} />
            <Route path="password" element={<p>Cambio obligatorio</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext>,
  );
};

describe('ProtectedRoute', () => {
  it('envía una sesión anónima al ingreso', () => {
    renderRoute(context({}));
    expect(screen.getByText('Ingreso')).toBeInTheDocument();
  });

  it('impide acceder al tablero con contraseña provisional', () => {
    renderRoute(context({ status: 'authenticated', user }));
    expect(screen.getByText('Cambio obligatorio')).toBeInTheDocument();
    expect(screen.queryByText('Tablero privado')).not.toBeInTheDocument();
  });
});
