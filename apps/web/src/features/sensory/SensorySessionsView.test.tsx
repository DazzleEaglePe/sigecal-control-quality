import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { SensorySessionsView } from './SensorySessionsView.js';

describe('SensorySessionsView', () => {
  it('contiene el ancho de la tabla dentro de su área desplazable', () => {
    const { container } = render(
      <MemoryRouter>
        <SensorySessionsView
          items={[]}
          selected={[]}
          profiles={[]}
          toggle={vi.fn()}
          compare={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(container.querySelector('.table-scroll')).toContainElement(
      container.querySelector('table'),
    );
  });
});
