import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  private getTransporter(): Transporter | null {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) {
      return null;
    }
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    const from = process.env.MAIL_FROM || process.env.SMTP_USER;
    const transporter = this.getTransporter();

    if (!transporter || !from) {
      if (process.env.NODE_ENV === 'production') {
        this.logger.warn(
          'SMTP is not fully configured; password reset email was not sent.',
        );
        return;
      }
      this.logger.log(`[dev] Password reset link for ${to}: ${resetUrl}`);
      return;
    }

    await transporter.sendMail({
      from,
      to,
      subject: 'Redefinição de senha — Vendlyhub',
      text: `Olá,\n\nPara redefinir sua senha, acesse o link abaixo (válido por tempo limitado):\n\n${resetUrl}\n\nSe você não solicitou este e-mail, ignore esta mensagem.\n`,
      html: `<p>Olá,</p><p>Para redefinir sua senha, clique no link abaixo (válido por tempo limitado):</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Se você não solicitou este e-mail, ignore esta mensagem.</p>`,
    });
  }
}
