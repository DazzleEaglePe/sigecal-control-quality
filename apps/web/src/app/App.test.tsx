import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { App } from './App.js';

vi.mock('../features/auth/useAuth.js', () => ({
  useAuth: () => ({
    status: 'anonymous',
    signIn: (): Promise<void> => Promise.resolve(),
  }),
}));

describe('App', () => {
  it('construye el árbol de rutas y presenta el acceso público', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole('heading', { name: 'Bienvenido a SIGECAL' }),
    ).toBeInTheDocument();
  });
});
