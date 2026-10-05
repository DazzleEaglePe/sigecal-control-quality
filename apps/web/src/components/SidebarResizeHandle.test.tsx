import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SidebarResizeHandle } from './SidebarResizeHandle.js';

const renderHandle = (widthRem: number, resizeTo = vi.fn()) => {
  render(
    <SidebarResizeHandle
      widthRem={widthRem}
      resizeTo={resizeTo}
      startResize={vi.fn()}
    />,
  );
  return {
    handle: screen.getByRole('separator', {
      name: 'Ajustar el ancho del menú',
    }),
    resizeTo,
  };
};

describe('SidebarResizeHandle', () => {
  it('permite ajustar el ancho con flechas y llegar a los límites', () => {
    const { handle, resizeTo } = renderHandle(16.5);

    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    fireEvent.keyDown(handle, { key: 'ArrowLeft' });
    fireEvent.keyDown(handle, { key: 'Home' });
    fireEvent.keyDown(handle, { key: 'End' });

    expect(resizeTo.mock.calls).toEqual([[17], [16], [14], [22]]);
    expect(handle).toHaveAttribute('aria-valuemin', '14');
    expect(handle).toHaveAttribute('aria-valuemax', '22');
    expect(handle).toHaveAttribute('aria-valuenow', '16.5');
  });

  it('consume solo las teclas de ajuste y respeta el mínimo', () => {
    const { handle, resizeTo } = renderHandle(14);
    const leftArrow = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'ArrowLeft',
    });

    handle.dispatchEvent(leftArrow);
    fireEvent.keyDown(handle, { key: 'Enter' });

    expect(leftArrow.defaultPrevented).toBe(true);
    expect(resizeTo).toHaveBeenCalledOnce();
    expect(resizeTo).toHaveBeenCalledWith(14);
  });
});
