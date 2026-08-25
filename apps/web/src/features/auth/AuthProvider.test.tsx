import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UserSession } from '@sigecal/shared';

import * as authApi from './auth-api.js';
import { AuthProvider } from './AuthProvider.js';
import { useAuth } from './useAuth.js';

vi.mock('./auth-api.js', () => ({
  restoreSession: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  changePassword: vi.fn(),
}));

const user: UserSession = {
  id: '7fa14bd0-5f55-4b48-ad2c-5e833e6bcbb5',
  firstName: 'Nicolle',
  lastName: 'Calidad',
  email: 'nicolle@example.com',
  role: 'ADMIN',
  mustChangePassword: false,
  permissions: ['USERS_MANAGE'],
};

const SessionProbe = (): React.JSX.Element => {
  const auth = useAuth();
  return (
    <div>
      <span>{auth.status}</span>
      <span>{auth.user?.firstName}</span>
    </div>
  );
};

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.mocked(authApi.restoreSession).mockResolvedValue({
      accessToken: 'solo-memoria',
      user,
    });
  });

  it('restaura por cookie y no persiste el access token en el navegador', async () => {
    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );
    expect(screen.getByText('booting')).toBeInTheDocument();
    expect(await screen.findByText('authenticated')).toBeInTheDocument();
    expect(screen.getByText('Nicolle')).toBeInTheDocument();
    expect(authApi.restoreSession).toHaveBeenCalledOnce();
    expect(localStorage).toHaveLength(0);
    expect(sessionStorage).toHaveLength(0);
  });
});
