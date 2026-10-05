import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import type { GrapeVarietyItem, PiscoTypeItem } from '@sigecal/shared';

import { AuthContext, type AuthContextValue } from '../auth/auth-context.js';
import { BatchForm } from './BatchForm.js';

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

const piscoTypes: readonly PiscoTypeItem[] = [
  {
    id: '11111111-1111-4111-a111-111111111111',
    code: 'ACHOLADO',
    name: 'Acholado',
    description: null,
    isActive: true,
  },
];
const varieties: readonly GrapeVarietyItem[] = [
  {
    id: '22222222-2222-4222-a222-222222222222',
    code: 'QUEBRANTA',
    name: 'Quebranta',
    isActive: true,
  },
  {
    id: '33333333-3333-4333-a333-333333333333',
    code: 'ITALIA',
    name: 'Italia',
    isActive: true,
  },
];

const renderForm = () =>
  render(
    <AuthContext value={authValue}>
      <MemoryRouter>
        <BatchForm masters={{ piscoTypes, varieties, stages: [] }} />
      </MemoryRouter>
    </AuthContext>,
  );

describe('BatchForm', () => {
  it('explica junto a cada control los datos requeridos', () => {
    renderForm();
    fireEvent.click(
      screen.getByRole('button', { name: 'Crear lote y abrir primera etapa' }),
    );

    expect(
      screen.getByText('Un pisco acholado requiere al menos dos variedades.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Indique una fecha de inicio válida.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Ingrese un volumen mayor que cero.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Fecha de inicio')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(authValue.request).not.toHaveBeenCalled();
  });

  it('quita el error de composición cuando se seleccionan dos variedades', () => {
    renderForm();
    fireEvent.click(
      screen.getByRole('button', { name: 'Crear lote y abrir primera etapa' }),
    );
    expect(
      screen.getByText('Un pisco acholado requiere al menos dos variedades.'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox', { name: /Quebranta/ }));
    expect(
      screen.getByText('Un pisco acholado requiere al menos dos variedades.'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: /Italia/ }));
    expect(
      screen.queryByText('Un pisco acholado requiere al menos dos variedades.'),
    ).not.toBeInTheDocument();
  });
});
