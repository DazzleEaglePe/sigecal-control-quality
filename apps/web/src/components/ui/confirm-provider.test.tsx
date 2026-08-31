import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { ConfirmProvider } from './confirm-provider.js';
import { useConfirm } from './use-confirm.js';

const ConfirmationHarness = (): React.JSX.Element => {
  const confirm = useConfirm();
  const [result, setResult] = useState('Pendiente');
  return (
    <>
      <button
        type="button"
        onClick={() => {
          void confirm({
            title: 'Cerrar lote',
            description: 'El cambio quedará auditado.',
            confirmLabel: 'Cerrar',
            destructive: true,
          }).then((accepted) => {
            setResult(accepted ? 'Confirmado' : 'Cancelado');
          });
        }}
      >
        Solicitar confirmación
      </button>
      <p>{result}</p>
    </>
  );
};

const renderHarness = (): void => {
  render(
    <ConfirmProvider>
      <ConfirmationHarness />
    </ConfirmProvider>,
  );
};

describe('ConfirmProvider', () => {
  it('resuelve la confirmación desde un diálogo accesible', async () => {
    renderHarness();
    fireEvent.click(
      screen.getByRole('button', { name: 'Solicitar confirmación' }),
    );
    expect(await screen.findByRole('alertdialog')).toBeVisible();
    expect(screen.getByText('El cambio quedará auditado.')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    await waitFor(() => expect(screen.getByText('Confirmado')).toBeVisible());
  });

  it('permite cancelar sin ejecutar la acción', async () => {
    renderHarness();
    fireEvent.click(
      screen.getByRole('button', { name: 'Solicitar confirmación' }),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.getByText('Cancelado')).toBeVisible());
  });
});
