import { expect, it } from 'vitest';

import {
  accountEmailText,
  createSmtpTransportOptions,
} from './account-access.mailer.js';

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

it('agrega autenticación SMTP cuando hay credenciales configuradas', () => {
  expect(
    createSmtpTransportOptions({
      NODE_ENV: 'production',
      MAIL_HOST: 'smtp.example.com',
      MAIL_PORT: 587,
      MAIL_SECURE: false,
      MAIL_USER: 'sigecal',
      MAIL_PASSWORD: 'test-password',
    }),
  ).toMatchObject({
    auth: { user: 'sigecal', pass: 'test-password' },
    requireTLS: true,
  });
});

it('omite autenticación cuando usa un relay local sin credenciales', () => {
  expect(
    createSmtpTransportOptions({
      NODE_ENV: 'development',
      MAIL_HOST: 'localhost',
      MAIL_PORT: 1025,
      MAIL_SECURE: false,
    }),
  ).not.toHaveProperty('auth');
});
