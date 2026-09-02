import nodemailer, { type Transporter } from 'nodemailer';

import { env } from '../../config/env.js';
import type { AccountMailPort, AccountTarget } from './account-access.types.js';

const accountUrl = (path: string, token: string): string => {
  const url = new URL(path, env.WEB_BASE_URL);
  url.searchParams.set('token', token);
  return url.toString();
};

export class SmtpAccountMailer implements AccountMailPort {
  private readonly transport: Transporter;

  public constructor() {
    this.transport = nodemailer.createTransport({
      host: env.MAIL_HOST,
      port: env.MAIL_PORT,
      secure: env.MAIL_SECURE,
    });
  }

  public async sendActivation(
    target: AccountTarget,
    token: string,
  ): Promise<void> {
    const url = accountUrl('/activar-cuenta', token);
    await this.send(
      target,
      'Active su cuenta de SIGECAL',
      `Hola ${target.firstName}. Defina su contraseña de SIGECAL en ${url}. Este enlace es temporal y de un solo uso.`,
    );
  }

  public async sendPasswordReset(
    target: AccountTarget,
    token: string,
  ): Promise<void> {
    const url = accountUrl('/restablecer-contrasena', token);
    await this.send(
      target,
      'Restablezca su contraseña de SIGECAL',
      `Hola ${target.firstName}. Restablezca su contraseña de SIGECAL en ${url}. Si no solicitó el cambio, ignore este mensaje.`,
    );
  }

  private async send(
    target: AccountTarget,
    subject: string,
    text: string,
  ): Promise<void> {
    await this.transport.sendMail({
      from: env.MAIL_FROM,
      to: target.email,
      subject,
      text,
    });
  }
}
