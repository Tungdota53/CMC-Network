import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationEmailService {
  private readonly logger = new Logger(NotificationEmailService.name);

  async sendNotificationEmail({
    to,
    subject,
    message,
    actionUrl,
  }: {
    to: string;
    subject: string;
    message: string;
    actionUrl?: string | null;
  }): Promise<boolean> {
    const smtpHost = process.env.SMTP_HOST;
    if (!smtpHost) {
      this.logger.warn(
        `SMTP not configured; notification email skipped for ${this.maskEmail(to)}`,
      );
      return false;
    }

    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASS
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
        connectionTimeout: Number(process.env.SMTP_TIMEOUT_MS ?? 5000),
        greetingTimeout: Number(process.env.SMTP_TIMEOUT_MS ?? 5000),
        socketTimeout: Number(process.env.SMTP_TIMEOUT_MS ?? 5000),
      });

      const appUrl = process.env.WEB_CLIENT_URL || process.env.APP_URL || '';
      const safeActionUrl = actionUrl
        ? new URL(actionUrl, appUrl || 'http://localhost').toString()
        : null;
      const settingsUrl = new URL(
        '/settings',
        appUrl || 'http://localhost',
      ).toString();

      await transporter.sendMail({
        from:
          process.env.SMTP_FROM ?? 'CMC Network <no-reply@cmcnetwork.io.vn>',
        to,
        subject,
        text: `${message}${safeActionUrl ? `\n\nXem chi tiết: ${safeActionUrl}` : ''}\n\nQuản lý thông báo email: ${settingsUrl}`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
            <h2 style="margin:0 0 12px">${this.escapeHtml(subject)}</h2>
            <p style="margin:0 0 16px">${this.escapeHtml(message)}</p>
            ${
              safeActionUrl
                ? `<p><a href="${this.escapeHtml(safeActionUrl)}" style="display:inline-block;background:#0891b2;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px">Xem chi tiết</a></p>`
                : ''
            }
            <p style="margin-top:24px;color:#64748b;font-size:12px">
              Bạn nhận email này vì đã bật thông báo email trên CMC Network.
              <a href="${this.escapeHtml(settingsUrl)}" style="color:#0891b2">Quản lý thông báo</a>
            </p>
          </div>
        `,
      });
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send notification email to ${this.maskEmail(to)}: ${(error as Error).message}`,
      );
      return false;
    }
  }

  private maskEmail(email: string) {
    const [name, domain] = email.split('@');
    if (!name || !domain) return 'invalid-email';
    return `${name.slice(0, 2)}***@${domain}`;
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
