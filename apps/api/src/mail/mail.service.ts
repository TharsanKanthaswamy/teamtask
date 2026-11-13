import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
      });
      this.logger.log(`SMTP Mail Transport configured for host: ${host}:${port} (secure: ${secure})`);
    } else {
      this.logger.warn(
        'SMTP credentials not fully configured (SMTP_HOST, SMTP_USER, SMTP_PASS). Emails will be logged to console in dev mode or sent via HTTPS API (RESEND_API_KEY / BREVO_API_KEY).',
      );
    }
  }

  async sendPasswordResetOtp(email: string, name: string, otp: string): Promise<boolean> {
    const from = process.env.SMTP_FROM || 'TeamTrack <noreply@teamtrack.app>';
    const subject = 'Your TeamTrack Password Reset Code';

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); overflow: hidden;" cellspacing="0" cellpadding="0">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0f172a; padding: 32px 32px 24px; text-align: center;">
              <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 10px; background-color: #3b82f6; color: #ffffff; font-weight: bold; font-size: 20px; margin-bottom: 8px;">
                TT
              </div>
              <h1 style="margin: 8px 0 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.025em;">
                TeamTrack
              </h1>
              <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13px;">
                Workforce & Project Management
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 12px; color: #0f172a; font-size: 18px; font-weight: 600;">
                Password Reset Request
              </h2>
              <p style="margin: 0 0 20px; color: #475569; font-size: 14px; line-height: 1.6;">
                Hello <strong>${name || 'there'}</strong>,<br/>
                We received a request to reset your password for your TeamTrack account (<strong>${email}</strong>). Use the one-time verification code below to set a new password:
              </p>

              <!-- OTP Code Display Box -->
              <div style="background-color: #f0fdf4; border: 2px dashed #22c55e; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #166534; display: block; margin-bottom: 8px;">
                  Your Verification Code
                </span>
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #15803d; display: inline-block; padding-left: 10px;">
                  ${otp}
                </span>
              </div>

              <p style="margin: 0 0 16px; color: #64748b; font-size: 13px; line-height: 1.5;">
                ⏱️ <strong>This code expires in 10 minutes.</strong><br/>
                For security reasons, do not share this verification code with anyone.
              </p>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

              <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.5;">
                If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                © ${new Date().getFullYear()} TeamTrack. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    // 1. Try Resend API over HTTPS (Port 443 - never blocked by cloud hosts like Render)
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.MAIL_FROM || process.env.SMTP_FROM || 'TeamTrack <onboarding@resend.dev>',
            to: [email],
            subject,
            text: `Your TeamTrack password reset code is: ${otp}. It expires in 10 minutes.`,
            html: htmlContent,
          }),
        });

        if (res.ok) {
          this.logger.log(`Password reset OTP email sent successfully via Resend HTTPS API to: ${email}`);
          return true;
        } else {
          const errText = await res.text();
          this.logger.error(`Resend API failed (${res.status}): ${errText}`);
        }
      } catch (err: any) {
        this.logger.error(`Resend API network error: ${err.message}`);
      }
    }

    // 2. Try Brevo API over HTTPS (Port 443 - free 300 emails/day, no domain lock)
    const brevoApiKey = process.env.BREVO_API_KEY;
    if (brevoApiKey) {
      try {
        const senderEmail = process.env.SMTP_USER || process.env.MAIL_SENDER || 'noreply@teamtrack.app';
        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': brevoApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sender: { name: 'TeamTrack', email: senderEmail },
            to: [{ email }],
            subject,
            htmlContent,
            textContent: `Your TeamTrack password reset code is: ${otp}. It expires in 10 minutes.`,
          }),
        });

        if (res.ok) {
          this.logger.log(`Password reset OTP email sent successfully via Brevo HTTPS API to: ${email}`);
          return true;
        } else {
          const errText = await res.text();
          this.logger.error(`Brevo API failed (${res.status}): ${errText}`);
        }
      } catch (err: any) {
        this.logger.error(`Brevo API network error: ${err.message}`);
      }
    }

    // 3. Try standard SMTP transport
    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from,
          to: email,
          subject,
          text: `Your TeamTrack password reset code is: ${otp}. It expires in 10 minutes.`,
          html: htmlContent,
        });
        this.logger.log(`Password reset OTP email sent successfully via SMTP to: ${email}`);
        return true;
      } catch (err: any) {
        this.logger.error(`Failed to send email to ${email} via SMTP: ${err.message}`);
        // Render free instances block outbound SMTP ports (25, 465, 587).
        this.logDevOtp(email, otp);
        return false;
      }
    } else {
      this.logDevOtp(email, otp);
      return true;
    }
  }

  private logDevOtp(email: string, otp: string) {
    console.log('\n============================================================');
    console.log('📧 [EMAIL DISPATCH - DEV/FALLBACK MODE]');
    console.log(`   To:      ${email}`);
    console.log(`   Subject: Your TeamTrack Password Reset Code`);
    console.log(`   CODE:    👉  ${otp}  👈`);
    console.log('   Expires: 10 minutes');
    console.log('   (Note: Cloud providers like Render block SMTP ports 465/587 on free tier.');
    console.log('    Use RESEND_API_KEY or BREVO_API_KEY to send via HTTPS Port 443)');
    console.log('============================================================\n');
  }
}
