import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { AiService } from '../ai/ai.service';
import { TwilioService } from '../twilio/twilio.service';

@Injectable()
export class EmailService {
  private client: ImapFlow;
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private configService: ConfigService,
    private aiService: AiService,
    private twilioService: TwilioService,
  ) {
    this.client = new ImapFlow({
      host: this.configService.get<string>('EMAIL_HOST') || 'imap.gmail.com',
      port: parseInt(this.configService.get<string>('EMAIL_PORT') || '993', 10),
      secure: true,
      auth: {
        user: this.configService.get<string>('EMAIL_USER') || 'your-email@example.com',
        pass: this.configService.get<string>('EMAIL_PASSWORD') || 'your-password',
      },
      logger: false,
    });
    this.listenForEmails();
  }

  private async listenForEmails() {
    try {
      await this.client.connect();
      this.logger.log('IMAP client connected');

      const lock = await this.client.getMailboxLock('INBOX');
      this.logger.log('Inbox locked and listening for new messages...');

      this.client.on('exists', async (data) => {
        if (data.prevCount < data.count) {
          this.logger.log(`New email detected! Total: ${data.count}`);
          try {
            const message = await this.client.fetchOne('*', { source: true });
            if (message && message.source) {
              const parsed = await simpleParser(message.source);
              const subject = parsed.subject || '';
              const body = parsed.text || '';

              this.logger.log('--------------------------------------------------');
              this.logger.log(`From: ${parsed.from?.text}`);
              this.logger.log(`Subject: ${subject}`);
              this.logger.log('Analyzing lead with AI...');

              const qualification = await this.aiService.parseEmail(subject, body);

              if (qualification.isQualified && qualification.phoneNumber) {
                this.logger.log(`Lead is QUALIFIED. Initiating call to ${qualification.phoneNumber}...`);
                await this.twilioService.initiateCall(qualification.phoneNumber);
              } else {
                this.logger.log(`Lead is NOT qualified. Reason: ${qualification.isQualified ? 'No phone number found' : 'Failed qualification criteria'}`);
              }
              this.logger.log('--------------------------------------------------');
            }
          } catch (err) {
            this.logger.error('Error fetching/parsing email:', err);
          }
        }
      });

      this.client.on('error', (err) => {
        this.logger.error('IMAP client error:', err);
        lock.release();
      });

      this.client.on('close', () => {
        this.logger.warn('IMAP connection closed');
        lock.release();
      });

    } catch (error) {
      this.logger.error('Failed to connect to IMAP:', error);
    }
  }
}
