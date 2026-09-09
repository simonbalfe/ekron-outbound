import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

import { buildContactRequestHtml } from './templates/contact-request.template';
import { buildSurveyorNotesHtml } from './templates/surveyor-notes.template';
import type { ContactEmailArgs } from './types/contact-email.types';
import type { CallOutcome } from './types/retell-email-webhook.types';
import type { SurveyorEmailArgs } from './types/surveyor-email.types';

function assertNever(value: never): never {
  void value;
  throw new Error('Unsupported call outcome');
}

@Injectable()
export class MailService {
  private resend: Resend;
  private readonly logger = new Logger(MailService.name);
  private readonly recipientAddress: string;
  private readonly senderAddress: string;

  constructor(private configService: ConfigService) {
    this.resend = new Resend(
      this.configService.getOrThrow<string>('RESEND_API_KEY'),
    );
    this.recipientAddress =
      this.configService.getOrThrow<string>('RECIPIENT_EMAIL');
    this.senderAddress = this.configService.getOrThrow<string>('SENDER_EMAIL');
  }

  async sendCallNotification(
    callerNumber: string,
    outcome: CallOutcome,
  ): Promise<void> {
    const { subject, body } = this.buildCallEmail(callerNumber, outcome);

    try {
      await this.resend.emails.send({
        from: this.senderAddress,
        to: this.recipientAddress,
        subject,
        html: body,
      });
      this.logger.log(
        `Call notification email sent: ${outcome} for ${callerNumber}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send call notification email for ${callerNumber}`,
        error,
      );
    }
  }

  private buildCallEmail(
    callerNumber: string,
    outcome: CallOutcome,
  ): { subject: string; body: string } {
    const timestamp = new Date().toLocaleString('en-GB', {
      timeZone: 'Europe/London',
    });
    console.log('outcome', outcome);
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

      case 'transferred_to_human':
        return {
          subject: `Call Transferred to Human Agent - ${callerNumber}`,
          body: this.wrapHtml(`
            <h2>Call Transferred from AI to Human Agent</h2>
            <p><strong>Caller:</strong> ${callerNumber}</p>
            <p><strong>Time:</strong> ${timestamp}</p>
            <p><strong>Status:</strong> AI agent transferred the call to a human agent.</p>
          `),
        };

      case 'user_hangup':
        return {
          subject: `Caller Hung Up - ${callerNumber}`,
          body: this.wrapHtml(`
            <h2>Caller Hung Up</h2>
            <p><strong>Caller:</strong> ${callerNumber}</p>
            <p><strong>Time:</strong> ${timestamp}</p>
            <p><strong>Status:</strong> The caller hung up the call.</p>
          `),
        };

      default:
        return assertNever(outcome);
    }
  }

  async sendContactEmail(args: ContactEmailArgs): Promise<void> {
    const html = buildContactRequestHtml(args);

    try {
      await this.resend.emails.send({
        from: this.senderAddress,
        to: this.recipientAddress,
        subject: args.subject,
        html,
      });
      this.logger.log(`Contact email sent: ${args.name} - ${args.phone}`);
    } catch (error) {
      this.logger.error(`Failed to send contact email for ${args.name}`, error);
      throw error;
    }
  }

  async sendSurveyorEmail(args: SurveyorEmailArgs): Promise<void> {
    const html = buildSurveyorNotesHtml(args);

    try {
      await this.resend.emails.send({
        from: this.senderAddress,
        to: this.recipientAddress,
        subject: args.subject,
        html,
      });
      this.logger.log(`Surveyor email sent: ${args.phone}`);
    } catch (error) {
      this.logger.error(
        `Failed to send surveyor email for ${args.phone}`,
        error,
      );
      throw error;
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
