import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import type { Permission, UserSession } from '@sigecal/shared';

import { AuthContext, type AuthContextValue } from './auth-context.js';
import { PermissionRoute } from './PermissionRoute.js';

const session = (permissions: readonly Permission[]): UserSession => ({
  id: '7fa14bd0-5f55-4b48-ad2c-5e833e6bcbb5',
  firstName: 'Ana',
  lastName: 'Paz',
  email: 'ana@example.com',
  role: 'ADMIN',
  mustChangePassword: false,
  permissions: [...permissions],
});

const context = (permissions: readonly Permission[]): AuthContextValue => ({
  status: 'authenticated',
  user: session(permissions),
  signIn: vi.fn(),
  signOut: vi.fn(),
  updatePassword: vi.fn(),
  clearNotice: vi.fn(),
  request: vi.fn(),
  requestText: vi.fn(),
  requestBlob: vi.fn(),
});

const renderProtected = (permissions: readonly Permission[]): void => {
  render(
    <AuthContext value={context(permissions)}>
      <MemoryRouter initialEntries={['/configuracion']}>
        <Routes>
          <Route index element={<p>Inicio</p>} />
          <Route element={<PermissionRoute permission="MASTERS_MANAGE" />}>
            <Route path="configuracion" element={<p>Maestros</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext>,
  );
};

describe('PermissionRoute', () => {
  it('permite ingresar con el permiso requerido', () => {
    renderProtected(['MASTERS_MANAGE']);
    expect(screen.getByText('Maestros')).toBeInTheDocument();
  });

  it('regresa al inicio cuando falta el permiso', () => {
    renderProtected(['RESULTS_RECORD']);
    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.queryByText('Maestros')).not.toBeInTheDocument();
  });
});
