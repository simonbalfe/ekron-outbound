import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

type CallOutcome = 'connected_human' | 'connected_ai' | 'human_no_answer_forwarded_ai';

@Injectable()
export class MailService {
  private resend: Resend;
  private readonly logger = new Logger(MailService.name);
  private readonly notificationRecipient: string;
  private readonly senderAddress: string;

  constructor(private configService: ConfigService) {
    this.resend = new Resend(
      this.configService.getOrThrow<string>('RESEND_API_KEY'),
    );
    this.notificationRecipient = 'simon@simonbalfe.com';
    this.senderAddress = 'admin@vocalbeam.com';
  }

  async sendCallNotification(
    callerNumber: string,
    outcome: CallOutcome,
  ): Promise<void> {
    const { subject, body } = this.buildCallEmail(callerNumber, outcome);

    try {
      await this.resend.emails.send({
        from: this.senderAddress,
        to: this.notificationRecipient,
        subject,
        html: body,
      });
      this.logger.log(`Call notification email sent: ${outcome} for ${callerNumber}`);
    } catch (error) {
      this.logger.error(`Failed to send call notification email for ${callerNumber}`, error);
    }
  }

  private buildCallEmail(
    callerNumber: string,
    outcome: CallOutcome,
  ): { subject: string; body: string } {
    const timestamp = new Date().toLocaleString('en-GB', {
      timeZone: 'Europe/London',
    });

    switch (outcome) {
      case 'connected_human':
        return {
          subject: `Incoming Call Connected - Human Agent - ${callerNumber}`,
          body: this.wrapHtml(`
            <h2>Call Connected to Human Agent</h2>
            <p><strong>Caller:</strong> ${callerNumber}</p>
            <p><strong>Time:</strong> ${timestamp}</p>
            <p><strong>Status:</strong> Successfully connected to human agent.</p>
          `),
        };

      case 'connected_ai':
        return {
          subject: `Incoming Call Connected - AI Agent - ${callerNumber}`,
          body: this.wrapHtml(`
            <h2>Call Routed to AI Agent</h2>
            <p><strong>Caller:</strong> ${callerNumber}</p>
            <p><strong>Time:</strong> ${timestamp}</p>
            <p><strong>Status:</strong> Call was routed directly to AI agent (outside business hours).</p>
          `),
        };

      case 'human_no_answer_forwarded_ai':
        return {
          subject: `Missed Call - Forwarded to AI - ${callerNumber}`,
          body: this.wrapHtml(`
            <h2>Human Agent Missed Call - Forwarded to AI</h2>
            <p><strong>Caller:</strong> ${callerNumber}</p>
            <p><strong>Time:</strong> ${timestamp}</p>
            <p><strong>Status:</strong> Human agent did not answer. Call was automatically forwarded to AI agent.</p>
          `),
        };
    }
  }

  private wrapHtml(content: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1a1a2e; color: #ffffff; padding: 16px 24px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 18px;">VocalBeam Call Log</h1>
        </div>
        <div style="background: #f8f9fa; padding: 24px; border: 1px solid #e9ecef; border-radius: 0 0 8px 8px;">
          ${content}
        </div>
      </div>
    `;
  }
}
