import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { NotFoundPage } from './NotFoundPage.js';

describe('NotFoundPage', () => {
  it('ofrece una salida accesible hacia el tablero', () => {
    render(<NotFoundPage />, { wrapper: MemoryRouter });

    expect(
      screen.getByRole('heading', { name: 'Esta ruta no existe' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Volver al tablero' }),
    ).toHaveAttribute('href', '/');
  });
});
