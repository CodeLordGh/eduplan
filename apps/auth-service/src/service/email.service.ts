import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import nodemailer from 'nodemailer';
import { createLogger } from '@eduflow/common';
import { AuthErrors, createEmailError } from '../errors/auth';

const logger = createLogger('email-service');

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

const getEmailConfig = (): EmailConfig => ({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

const transporter = nodemailer.createTransport(getEmailConfig());

export const sendOTPEmail = (
  to: string,
  code: string,
  purpose: string
): TE.TaskEither<AuthErrors, void> =>
  pipe(
    TE.tryCatch(
      async () => {
        const subject = `Your EduFlow ${purpose} Code`;
        const text = `Your verification code is: ${code}\nThis code will expire in 15 minutes.`;
        const html = `
          <h2>Your EduFlow Verification Code</h2>
          <p>Your verification code for ${purpose} is:</p>
          <h1 style="color: #4A90E2; font-size: 32px; letter-spacing: 5px;">${code}</h1>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        `;

        await transporter.sendMail({
          from: process.env.SMTP_FROM || 'noreply@eduflow.com',
          to,
          subject,
          text,
          html,
        });

        logger.info(`OTP email sent to ${to} for ${purpose}`);
      },
      (error: unknown) => {
        logger.error(
          'Failed to send OTP email',
          error instanceof Error ? error : new Error(String(error))
        );
        return createEmailError(error instanceof Error ? error : new Error(String(error)));
      }
    )
  );
