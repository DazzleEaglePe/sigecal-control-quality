import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { BatchItem } from '@sigecal/shared';

import { BatchTable } from './BatchTable.js';

const batch: BatchItem = {
  id: '11111111-1111-4111-a111-111111111111',
  code: 'LT-2026-0001',
  piscoType: {
    id: '22222222-2222-4222-a222-222222222222',
    code: 'PURO',
    name: 'Puro',
  },
  currentStage: {
    id: '33333333-3333-4333-a333-333333333333',
    code: 'RECEPCION_UVA',
    name: 'Recepción de uva',
    sequence: 1,
  },
  status: 'EN_PROCESO',
  startDate: '2026-08-24',
  closeDate: null,
  rejectedAt: null,
  rejectedBy: null,
  rejectionReason: null,
  volumeLiters: '500',
  harvestOrigin: 'Ica',
  notes: null,
  createdBy: {
    id: '44444444-4444-4444-a444-444444444444',
    firstName: 'Nicolle',
    lastName: 'Calidad',
  },
  dataOrigin: 'REAL',
  createdAt: '2026-08-24T14:00:00.000Z',
  updatedAt: '2026-08-24T14:00:00.000Z',
  varieties: [
    {
      variety: {
        id: '55555555-5555-4555-a555-555555555555',
        code: 'QUEBRANTA',
        name: 'Quebranta',
      },
      percentage: '100',
    },
  ],
  openNonConformities: 0,
  hasInspections: false,
};

describe('BatchTable', () => {
  it('presenta lote, estado, origen y vínculo al detalle', () => {
    render(
      <MemoryRouter>
        <BatchTable items={[batch]} />
      </MemoryRouter>,
    );
    expect(screen.getByText('LT-2026-0001')).toBeInTheDocument();
    expect(screen.getByText('En proceso')).toBeInTheDocument();
    expect(screen.getByText('Real')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver detalle' })).toHaveAttribute(
      'href',
      `/lotes/${batch.id}`,
    );
  });
});
