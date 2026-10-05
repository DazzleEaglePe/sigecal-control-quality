import nodemailer from 'nodemailer';

import { createSmtpTransportOptions } from '../modules/account-access/account-access.mailer.js';

const verifySmtp = async (): Promise<void> => {
  const transport = nodemailer.createTransport(createSmtpTransportOptions());

  try {
    await transport.verify();
    console.info(
      'Conexión SMTP y autenticación verificadas; no se envió correo.',
    );
  } catch {
    console.error(
      'No se pudo verificar SMTP. Revise el host, TLS y credenciales con el proveedor.',
    );
    process.exitCode = 1;
  } finally {
    transport.close();
  }
};

void verifySmtp();
