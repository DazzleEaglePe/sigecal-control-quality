import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PwaInstallButton } from './PwaInstallButton.js';

interface PromptEvent extends Event {
  prompt: ReturnType<typeof vi.fn>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const installPromptEvent = (): PromptEvent => {
  const event = new Event('beforeinstallprompt', { cancelable: true });
  return Object.assign(event, {
    prompt: vi.fn().mockResolvedValue(undefined),
    userChoice: Promise.resolve({ outcome: 'accepted' as const }),
  });
};

describe('PwaInstallButton', () => {
  it('muestra y ejecuta el aviso de instalación disponible', async () => {
    render(<PwaInstallButton />);
    expect(
      screen.queryByRole('button', { name: 'Instalar SIGECAL en este dispositivo' }),
    ).not.toBeInTheDocument();

    const event = installPromptEvent();
    fireEvent(window, event);

    const button = await screen.findByRole('button', {
      name: 'Instalar SIGECAL en este dispositivo',
    });
    fireEvent.click(button);

    await waitFor(() => {
      expect(event.prompt).toHaveBeenCalledOnce();
    });
    expect(
      screen.queryByRole('button', { name: 'Instalar SIGECAL en este dispositivo' }),
    ).not.toBeInTheDocument();
  });
});
