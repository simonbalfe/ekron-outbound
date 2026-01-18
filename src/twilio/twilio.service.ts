import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import Retell from 'retell-sdk';

@Injectable()
export class TwilioService {
  private client: Twilio;
  private retellClient: Retell;
  private readonly logger = new Logger(TwilioService.name);
  private attempts: Map<string, number> = new Map();
  private callCache: Map<string, { callId: string; timestamp: number }> = new Map();

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const retellApiKey = this.configService.get<string>('RETELL_API_KEY');

    if (!accountSid || !authToken) {
      this.logger.warn('Twilio credentials not configured');
    }

    if (!retellApiKey) {
        this.logger.warn('Retell API key not configured');
    }

    this.client = new Twilio(accountSid, authToken);
    if (retellApiKey) {
        this.retellClient = new Retell({ apiKey: retellApiKey });
    }

    // Clean up cache periodically (every hour)
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.callCache.entries()) {
        if (now - value.timestamp > 3600000) { // 1 hour
          this.callCache.delete(key);
        }
      }
    }, 3600000);
  }

  async initiateCall(leadPhone: string): Promise<void> {
    const currentAttempts = this.attempts.get(leadPhone) || 0;

    this.logger.log(`Initiating call to ${leadPhone}...`);
    
    if (currentAttempts >= 2) {
      this.logger.log(`Max attempts reached for ${leadPhone}`);
      return;
    }

    this.attempts.set(leadPhone, currentAttempts + 1);

    const twilioNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');
    if (!twilioNumber) {
      this.logger.error('TWILIO_PHONE_NUMBER is not defined in environment variables');
      return;
    }
    const baseUrl = this.configService.get<string>('BASE_URL');
    if (!baseUrl) {
      this.logger.error('BASE_URL is not defined in environment variables');
      return;
    }

    const scriptUrl = `${baseUrl}/twilio/router`;
    const statusCallbackUrl = `${baseUrl}/twilio/call-status`;

    this.logger.log(`Calling Twilio API: To=${leadPhone}, From=${twilioNumber}`);
    this.logger.log(`TwiML URL: ${scriptUrl}`);
    this.logger.log(`Status Callback: ${statusCallbackUrl}`);

    try {
      await this.client.calls.create({
        to: leadPhone,
        from: twilioNumber,
        url: scriptUrl,
        statusCallback: statusCallbackUrl,
        machineDetection: 'Enable', // Enable Answering Machine Detection
      });
      this.logger.log(`Call successfully queued with Twilio for ${leadPhone}`);
    } catch (error) {
      this.logger.error(`Failed to initiate call to ${leadPhone}`, error);
    }
  }

  async sendSms(to: string, body: string): Promise<void> {
    const twilioNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');
    if (!twilioNumber) {
      this.logger.error('TWILIO_PHONE_NUMBER is not defined');
      return;
    }

    try {
      this.logger.log(`Sending SMS to ${to}: "${body}"`);
      await this.client.messages.create({
        body,
        to,
        from: twilioNumber,
      });
      this.logger.log(`SMS sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}`, error);
    }
  }

  scheduleRetry(leadPhone: string): void {
    this.logger.log(`Scheduling retry for ${leadPhone} in 120s`);
    setTimeout(() => {
      this.logger.log(`Executing retry for ${leadPhone}`);
      this.initiateCall(leadPhone);
    }, 120000);
  }

  async registerRetellCall(callSid: string, direction: 'inbound' | 'outbound' = 'inbound'): Promise<string> {
    if (this.callCache.has(callSid)) {
      this.logger.log(`Returning cached Retell call ID for CallSid: ${callSid}`);
      return this.callCache.get(callSid)?.callId || '';
    }
    const agentId = this.configService.get<string>('RETELL_AGENT_ID');
    if (!this.retellClient || !agentId) {
       throw new Error('Retell client or Agent ID not configured');
    }
    try {
        const phoneCallResponse = await this.retellClient.call.registerPhoneCall({
            agent_id: agentId,
            direction: direction,
        });
        
        const callId = phoneCallResponse.call_id;
        this.logger.log(`Retell call registered. Call ID: ${callId}`);
        this.callCache.set(callSid, { callId, timestamp: Date.now() });
        return callId;
    } catch (error) {
        this.logger.error('Failed to register call with Retell SDK', error);
        throw error;
    }
  }

  getAgentPhone(): string {
    return this.configService.get<string>('AGENT_PHONE_PRIMARY') || '';
  }

  getBackupAgentPhone(): string {
    return this.configService.get<string>('AGENT_PHONE_BACKUP') || '';
  }

  isBusinessHours(): boolean {
    const now = new Date();
    const day = now.getDay(); // 0 is Sunday, 6 is Saturday
    const hour = now.getHours();

    // Monday to Friday, 9am to 5pm
    const isWeekday = day >= 1 && day <= 5;
    const isWorkingHours = hour >= 9 && hour < 17;

    return isWeekday && isWorkingHours;
  }



}
