import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    this.fromAddress = this.configService.get<string>('SMTP_USER', '');

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: false, // STARTTLS على المنفذ 587
      auth: {
        user: this.fromAddress,
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendOtpEmail(to: string, otp: string): Promise<void> {
    await this.transporter.sendMail({
      from: this.fromAddress,
      to,
      subject: 'رمز التحقق من حسابك',
      text: `رمز التحقق الخاص بك هو: ${otp}\nصالح لمدة 10 دقائق.`,
      html: `<p>رمز التحقق الخاص بك هو: <b>${otp}</b></p><p>صالح لمدة 10 دقائق.</p>`,
    });

    this.logger.log(`OTP email sent to ${to}`);
  }
}
