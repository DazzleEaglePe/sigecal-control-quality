import { expect, it, vi } from 'vitest';

import { NotificationGenerationService } from './notifications.generation.js';
import type { NotificationGenerationPort } from './notifications.types.js';

it('calcula una ventana de aviso de 48 horas', async () => {
  const generate = vi.fn().mockResolvedValue(2);
  const repository: NotificationGenerationPort = { generate };
  const service = new NotificationGenerationService(repository);
  const now = new Date('2026-09-06T12:00:00.000Z');

  await expect(service.execute(now)).resolves.toBe(2);
  expect(generate).toHaveBeenCalledWith(
    now,
    new Date('2026-09-08T12:00:00.000Z'),
  );
});
