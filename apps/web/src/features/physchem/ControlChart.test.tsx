import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { PhysChemControlChart } from '@sigecal/shared';

import { ControlChart } from './ControlChart.js';

const chart: PhysChemControlChart = {
  points: [
    {
      date: '2026-08-20',
      value: 3.5,
      batchCode: 'LT-001',
      outOfControl: false,
    },
    { date: '2026-08-21', value: 5.1, batchCode: 'LT-002', outOfControl: true },
  ],
  centerLine: 4,
  upperControlLimit: 5,
  lowerControlLimit: 3,
  sampleSize: 2,
  sufficientData: false,
  includesDemo: false,
};

describe('ControlChart', () => {
  it('dibuja límites, puntos y alerta de muestra insuficiente', () => {
    const { container } = render(<ControlChart chart={chart} />);
    expect(
      screen.getByRole('img', { name: 'Gráfico de control fisicoquímico' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Muestra insuficiente: 2 de 8 mediciones mínimas.'),
    ).toBeInTheDocument();
    expect(container.querySelector('circle.is-alert')).toBeInTheDocument();
  });

  it('presenta un estado vacío sin mediciones comparables', () => {
    render(<ControlChart chart={{ ...chart, points: [], sampleSize: 0 }} />);
    expect(
      screen.getByText(
        'No existen mediciones comparables para esta selección.',
      ),
    ).toBeInTheDocument();
  });
});
