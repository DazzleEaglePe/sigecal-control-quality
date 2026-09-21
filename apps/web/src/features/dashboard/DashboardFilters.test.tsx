import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DashboardFilters } from './DashboardFilters.js';

describe('DashboardFilters', () => {
  it('aplica de inmediato el cambio de datos DEMO', () => {
    const onApply = vi.fn();
    render(
      <DashboardFilters
        canIncludeDemo
        filters={{
          dateFrom: '2026-01-01',
          dateTo: '2026-09-07',
          includeDemo: false,
        }}
        onApply={onApply}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Datos DEMO' }));
    expect(onApply).toHaveBeenCalledWith({
      dateFrom: '2026-01-01',
      dateTo: '2026-09-07',
      includeDemo: true,
    });
  });
});
