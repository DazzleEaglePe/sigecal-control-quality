import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AuthContext, type AuthContextValue } from '../auth/auth-context.js';
import { NewUserForm } from './NewUserForm.js';

const authValue: AuthContextValue = {
  status: 'authenticated',
  signIn: vi.fn(),
  signOut: vi.fn(),
  updatePassword: vi.fn(),
  clearNotice: vi.fn(),
  request: vi.fn(),
  requestText: vi.fn(),
  requestBlob: vi.fn(),
};

describe('NewUserForm', () => {
  it('muestra los errores junto a cada campo al enviar vacío', () => {
    render(
      <AuthContext value={authValue}>
        <NewUserForm areas={[]} added={vi.fn()} />
      </AuthContext>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Crear usuario' }));

    expect(screen.getByText('Ingrese un nombre válido.')).toBeInTheDocument();
    expect(screen.getByText('Ingrese los apellidos.')).toBeInTheDocument();
    expect(
      screen.getByText('Ingrese el correo institucional.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Seleccione un área activa.')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Revise los nombres');
    expect(screen.getByRole('textbox', { name: 'Nombre' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByRole('textbox', { name: 'Nombre' })).toHaveAttribute(
      'aria-describedby',
      'new-user-first-name-issue',
    );
  });

  it('actualiza el error del correo mientras se corrige el campo', () => {
    render(
      <AuthContext value={authValue}>
        <NewUserForm areas={[]} added={vi.fn()} />
      </AuthContext>,
    );

    const email = screen.getByLabelText('Correo institucional');
    fireEvent.change(email, { target: { value: 'correo-invalido' } });

    expect(screen.getByText('Ingrese un correo válido.')).toBeInTheDocument();
    fireEvent.change(email, { target: { value: 'persona@sigecal.pe' } });
    expect(
      screen.queryByText('Ingrese un correo válido.'),
    ).not.toBeInTheDocument();
  });
});
