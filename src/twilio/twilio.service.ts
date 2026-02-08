import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class TwilioService {
  private client: Twilio;
  private readonly logger = new Logger(TwilioService.name);

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

    this.logger.log(`Twilio init: SID=${accountSid ? accountSid.substring(0, 6) + '...' : 'MISSING'}, Token=${authToken ? authToken.substring(0, 4) + '...' : 'MISSING'}`);

    if (!accountSid || !authToken) {
      this.logger.warn('Twilio credentials not configured');
    }

    this.client = new Twilio(accountSid, authToken);
  }

  shouldRouteToAI(): boolean {
    const useBusinessHours = this.configService.get<string>('USE_BUSINESS_HOURS') === 'true';
    if (!useBusinessHours) {
      return true;
    }

    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();

    const isBusinessHours = this.isWithinBusinessHours(day, hour);

    return !isBusinessHours;
  }

  private isWithinBusinessHours(day: number, hour: number): boolean {
    switch (day) {
      case 0:
        return false;
      case 6:
        return hour >= 8 && hour < 13;
      default:
        return hour >= 8 && hour < 16;
    }
  }
}
