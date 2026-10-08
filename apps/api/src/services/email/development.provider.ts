import { IEmailService } from './email.service.js';
import { logger } from '../../utils/logger.js';
import { env } from '../../config/env.js';

export interface SentEmailRecord {
  toEmail: string;
  type: 'verification' | 'password_reset';
  token: string;
  firstName: string;
  url: string;
  sentAt: Date;
}

export class DevelopmentEmailProvider implements IEmailService {
  private sentEmails: SentEmailRecord[] = [];

  async sendVerificationEmail(toEmail: string, token: string, firstName: string): Promise<void> {
    const url = `${env.WEB_URL}/auth/verify-email?token=${encodeURIComponent(token)}`;
    const record: SentEmailRecord = {
      toEmail,
      type: 'verification',
      token,
      firstName,
      url,
      sentAt: new Date(),
    };
    this.sentEmails.push(record);

    logger.info(`[DEV EMAIL] Verification email simulated for: ${toEmail}`, {
      type: 'verification',
      firstName,
      verificationUrl: url,
    });
  }

  async sendPasswordResetEmail(toEmail: string, token: string, firstName: string): Promise<void> {
    const url = `${env.WEB_URL}/auth/reset-password?token=${encodeURIComponent(token)}`;
    const record: SentEmailRecord = {
      toEmail,
      type: 'password_reset',
      token,
      firstName,
      url,
      sentAt: new Date(),
    };
    this.sentEmails.push(record);

    logger.info(`[DEV EMAIL] Password reset email simulated for: ${toEmail}`, {
      type: 'password_reset',
      firstName,
      resetUrl: url,
    });
  }

  /**
   * Helper for tests & local development to inspect the last sent email for a recipient.
   */
  getLastSentEmail(toEmail: string): SentEmailRecord | undefined {
    return [...this.sentEmails].reverse().find((e) => e.toEmail === toEmail);
  }

  /**
   * Clear in-memory history (useful for test resets).
   */
  clearHistory(): void {
    this.sentEmails = [];
  }
}
