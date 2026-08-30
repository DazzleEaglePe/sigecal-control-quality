import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { InspectionItem, PhysChemResultItem } from '@sigecal/shared';

import type { AuthorizedRequest } from '../auth/auth-context.js';
import { PhysChemExecutionForm } from './PhysChemExecutionForm.js';
import {
  createPhysChemResults,
  validatePhysChemResults,
} from './physchem-api.js';

vi.mock('./physchem-api.js', () => ({
  createPhysChemResults: vi.fn(),
  validatePhysChemResults: vi.fn(),
}));

const ids = {
  inspection: '11111111-1111-4111-a111-111111111111',
  batch: '22222222-2222-4222-a222-222222222222',
  parameter: '33333333-3333-4333-a333-333333333333',
  standard: '44444444-4444-4444-a444-444444444444',
  equipment: '55555555-5555-4555-a555-555555555555',
  user: '66666666-6666-4666-a666-666666666666',
  nc: '77777777-7777-4777-a777-777777777777',
  result: '88888888-8888-4888-a888-888888888888',
} as const;

const inspection: InspectionItem = {
  id: ids.inspection,
  code: 'INS-2026-0001',
  batch: { id: ids.batch, code: 'LT-2026-0001' },
  stage: { id: ids.parameter, code: 'DEST', name: 'Destilación' },
  type: 'FISICOQUIMICO',
  status: 'EN_PROCESO',
  scheduledDate: '2026-08-25T15:00:00.000Z',
  executedAt: null,
  responsible: { id: ids.user, firstName: 'Ana', lastName: 'Calidad' },
  equipment: {
    id: ids.equipment,
    code: 'EQ-01',
    name: 'Alcoholímetro',
    status: 'OPERATIVO',
  },
  rescheduledFromId: null,
  rescheduledToId: null,
  changeReason: null,
  notes: null,
  createdBy: { id: ids.user, firstName: 'Ana', lastName: 'Calidad' },
  dataOrigin: 'DEMO',
  parameters: [
    {
      id: ids.parameter,
      code: 'PH',
      name: 'pH',
      type: 'FISICOQUIMICO',
      unit: null,
    },
  ],
  recordedParameterIds: [],
};

const standard = {
  id: ids.standard,
  minValue: '3',
  maxValue: '4',
  targetValue: '3.5',
  referenceNorm: 'Estándar interno',
} as const;

const savedResult: PhysChemResultItem = {
  id: ids.result,
  inspection: { id: ids.inspection, code: inspection.code },
  batch: inspection.batch,
  parameter: { id: ids.parameter, code: 'PH', name: 'pH', unit: null },
  standard,
  value: '5',
  status: 'NO_CONFORME',
  observation: null,
  equipment: { id: ids.equipment, code: 'EQ-01', name: 'Alcoholímetro' },
  calibrationRef: 'CAL-001',
  recordedBy: { id: ids.user, firstName: 'Ana', lastName: 'Calidad' },
  recordedAt: '2026-08-25T16:00:00.000Z',
  dataOrigin: 'DEMO',
  annulledBy: null,
  annulledAt: null,
  annulReason: null,
  replacesId: null,
  replacementId: null,
  nonConformity: {
    id: ids.nc,
    code: 'NC-2026-0001',
    status: 'ABIERTA',
    severity: 'MODERADA',
  },
};

const renderForm = (completed: () => Promise<void>): void => {
  render(
    <MemoryRouter>
      <PhysChemExecutionForm
        request={vi.fn() as unknown as AuthorizedRequest}
        inspection={inspection}
        completed={completed}
      />
    </MemoryRouter>,
  );
};

describe('PhysChemExecutionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(validatePhysChemResults).mockResolvedValue([
      { parameterId: ids.parameter, value: 5, status: 'NO_CONFORME', standard },
    ]);
    vi.mocked(createPhysChemResults).mockResolvedValue([savedResult]);
  });

  it('revisa antes de guardar y enlaza la NC creada', async () => {
    const completed = vi.fn().mockResolvedValue(undefined);
    renderForm(completed);
    fireEvent.change(screen.getByLabelText('Valor de pH'), {
      target: { value: '5' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Revisar y guardar definitivo' }),
    );
    expect(await screen.findByText('Revise antes de guardar')).toBeVisible();
    expect(createPhysChemResults).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole('button', { name: 'Confirmar guardado definitivo' }),
    );
    await waitFor(() => {
      expect(createPhysChemResults).toHaveBeenCalledOnce();
    });
    expect(
      await screen.findByRole('link', { name: 'NC-2026-0001' }),
    ).toHaveAttribute(
      'href',
      `/lotes/${ids.batch}?tab=nonconformities&focus=${ids.nc}`,
    );
    expect(completed).toHaveBeenCalledOnce();
  });
});
