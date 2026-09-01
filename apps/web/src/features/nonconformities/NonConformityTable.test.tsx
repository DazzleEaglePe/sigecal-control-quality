import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { NonConformityItem } from '@sigecal/shared';

import { NonConformityTable } from './NonConformityTable.js';

const nonConformity: NonConformityItem = {
  id: '11111111-1111-4111-a111-111111111111',
  code: 'NC-2026-0001',
  batch: { id: '22222222-2222-4222-a222-222222222222', code: 'LT-2026-0001' },
  stage: {
    id: '33333333-3333-4333-a333-333333333333',
    code: 'FERMENTACION',
    name: 'Fermentación',
  },
  inspectionId: null,
  physChemResultId: null,
  sensorySessionId: null,
  origin: 'MANUAL',
  severity: 'MODERADA',
  status: 'ABIERTA',
  description: 'Fuga detectada en la línea de fermentación.',
  rootCause: null,
  detectedAt: '2026-09-01T10:00:00.000Z',
  detectedBy: {
    id: '44444444-4444-4444-a444-444444444444',
    firstName: 'Ana',
    lastName: 'Torres',
  },
  assignedTo: null,
  assignedArea: null,
  attentionStartedAt: null,
  responseTimeHours: null,
  closedAt: null,
  closedBy: null,
  closeComment: null,
  closureTimeHours: null,
  annulledAt: null,
  annulledBy: null,
  annulReason: null,
  dataOrigin: 'REAL',
};

describe('NonConformityTable', () => {
  it('presenta código, severidad, estado y vínculo al detalle', () => {
    render(
      <MemoryRouter>
        <NonConformityTable items={[nonConformity]} />
      </MemoryRouter>,
    );
    expect(screen.getByText('NC-2026-0001')).toBeInTheDocument();
    expect(screen.getByText('Moderada')).toBeInTheDocument();
    expect(screen.getByText('Abierta')).toBeInTheDocument();
    expect(screen.getByText('Sin asignar')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver detalle' })).toHaveAttribute(
      'href',
      `/no-conformidades/${nonConformity.id}`,
    );
  });

  it('muestra un estado vacío cuando no hay registros', () => {
    render(
      <MemoryRouter>
        <NonConformityTable items={[]} />
      </MemoryRouter>,
    );
    expect(
      screen.getByText('No encontramos no conformidades'),
    ).toBeInTheDocument();
  });
});
