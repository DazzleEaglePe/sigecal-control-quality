import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { InspectionItem } from '@sigecal/shared';

import { InspectionTable } from './InspectionTable.js';

const inspection: InspectionItem = {
  id: '11111111-1111-4111-a111-111111111111',
  code: 'INS-2026-0001',
  batch: { id: '22222222-2222-4222-a222-222222222222', code: 'LT-2026-0001' },
  stage: {
    id: '33333333-3333-4333-a333-333333333333',
    code: 'FERMENTACION',
    name: 'Fermentación',
  },
  type: 'FISICOQUIMICO',
  status: 'PROGRAMADA',
  scheduledDate: '2026-08-25T15:00:00.000Z',
  executedAt: null,
  responsible: {
    id: '44444444-4444-4444-a444-444444444444',
    firstName: 'Ana',
    lastName: 'Calidad',
  },
  equipment: null,
  rescheduledFromId: null,
  rescheduledToId: null,
  changeReason: null,
  notes: null,
  createdBy: {
    id: '55555555-5555-4555-a555-555555555555',
    firstName: 'Jefe',
    lastName: 'Calidad',
  },
  dataOrigin: 'REAL',
  parameters: [
    {
      id: '66666666-6666-4666-a666-666666666666',
      code: 'PH',
      name: 'pH',
      type: 'FISICOQUIMICO',
      unit: null,
    },
  ],
  recordedParameterIds: [],
};

describe('InspectionTable', () => {
  it('presenta la trazabilidad principal y el vínculo al detalle', () => {
    render(
      <MemoryRouter>
        <InspectionTable items={[inspection]} />
      </MemoryRouter>,
    );
    expect(screen.getByText('INS-2026-0001')).toBeInTheDocument();
    expect(screen.getByText('Fermentación')).toBeInTheDocument();
    expect(screen.getByText('Programada')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Abrir INS-2026-0001' }),
    ).toHaveAttribute('href', `/inspecciones/${inspection.id}`);
  });

  it('explica cuando la consulta no tiene resultados', () => {
    render(<InspectionTable items={[]} />);
    expect(
      screen.getByText('No hay inspecciones para mostrar.'),
    ).toBeInTheDocument();
  });
});
