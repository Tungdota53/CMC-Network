import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendOtpEmail(email: string, otp: string): Promise<boolean> {
    return this.sendOtpMessage({
      email,
      otp,
      subject: 'Mã xác minh CMC Network',
      purpose: 'xác minh CMC Network',
    });
  }

  async sendPasswordResetEmail(email: string, otp: string): Promise<boolean> {
    return this.sendOtpMessage({
      email,
      otp,
      subject: 'Mã đặt lại mật khẩu CMC Network',
      purpose: 'đặt lại mật khẩu CMC Network',
    });
  }

  private async sendOtpMessage({
    email,
    otp,
    subject,
    purpose,
  }: {
    email: string;
    otp: string;
    subject: string;
    purpose: string;
  }): Promise<boolean> {
    const allowOtpLogging = process.env.ALLOW_OTP_LOGGING === 'true';
    const smtpHost = process.env.SMTP_HOST;

    if (!smtpHost) {
      if (allowOtpLogging) {
        this.logger.warn(`Local OTP for ${this.maskEmail(email)}: ${otp}`);
      } else {
        this.logger.warn(
          `SMTP not configured; OTP email skipped for ${this.maskEmail(email)}`,
        );
      }
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
            ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              }
            : undefined,
        connectionTimeout: Number(process.env.SMTP_TIMEOUT_MS ?? 5000),
        greetingTimeout: Number(process.env.SMTP_TIMEOUT_MS ?? 5000),
        socketTimeout: Number(process.env.SMTP_TIMEOUT_MS ?? 5000),
      });

      await transporter.sendMail({
        from:
          process.env.SMTP_FROM ?? 'CMC Network <no-reply@cmcnetwork.io.vn>',
        to: email,
        subject,
        text: `Mã ${purpose} của bạn là ${otp}. Mã hết hạn sau ${process.env.OTP_TTL_MINUTES ?? '10'} phút. Nếu bạn không yêu cầu mã này, hãy bỏ qua email.`,
        html: `<p>Mã ${purpose} của bạn là:</p><p style="font-size:24px;font-weight:700;letter-spacing:4px">${otp}</p><p>Mã hết hạn sau ${process.env.OTP_TTL_MINUTES ?? '10'} phút.</p><p>Nếu bạn không yêu cầu mã này, hãy bỏ qua email.</p>`,
      });
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send OTP email to ${this.maskEmail(email)}: ${(error as Error).message}`,
      );
      if (allowOtpLogging) {
        this.logger.warn(`Local OTP for ${this.maskEmail(email)}: ${otp}`);
      }
      return false;
    }
  }

  private maskEmail(email: string) {
    const [name, domain] = email.split('@');
    if (!name || !domain) return 'invalid-email';
    return `${name.slice(0, 2)}***@${domain}`;
  }
}
