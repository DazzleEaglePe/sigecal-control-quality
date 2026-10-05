import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { AccountPasswordForm } from './AccountPasswordForm.js';

describe('AccountPasswordForm', () => {
  it('anuncia cuando falta el token del enlace', () => {
    render(
      <MemoryRouter initialEntries={['/activar-cuenta']}>
        <AccountPasswordForm mode="activate" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'El enlace no contiene un token válido.',
    );
    expect(
      screen.getByRole('button', { name: 'Activar cuenta' }),
    ).toBeDisabled();
  });
});
