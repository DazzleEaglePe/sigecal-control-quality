import { expect, it } from 'vitest';

import { accountEmailText } from './account-access.mailer.js';

it('separa el enlace del texto para no incorporar puntuación al token', () => {
  const url = 'http://localhost:5173/restablecer-contrasena?token=abc_DEF-123';
  const message = accountEmailText(
    'Restablezca su contraseña',
    url,
    'Ignore este mensaje si no solicitó el cambio.',
  );
  const linkLine = message.split('\n').find((line) => line.startsWith('http'));

  expect(linkLine).toBe(url);
  expect(linkLine?.endsWith('.')).toBe(false);
});
