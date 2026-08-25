import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HealthStatus } from './HealthStatus.js';

afterEach(() => vi.unstubAllGlobals());

describe('HealthStatus', () => {
  it('muestra disponibilidad cuando la API responde el contrato válido', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              status: 'ok',
              database: 'connected',
              timestamp: new Date().toISOString(),
            },
          }),
      }),
    );
    render(<HealthStatus />);

    expect(screen.getByText('Comprobando el entorno')).toBeInTheDocument();
    expect(await screen.findByText('Entorno disponible')).toBeInTheDocument();
  });

  it('ofrece reintento sin mostrar detalles técnicos', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('ECONNREFUSED')),
    );
    render(<HealthStatus />);

    expect(
      await screen.findByRole('button', { name: 'Reintentar' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('ECONNREFUSED')).not.toBeInTheDocument();
  });
});
