import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { TwilioService } from './twilio/twilio.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly twilioService: TwilioService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test-call')
  async triggerCall(@Query('phone') phone: string) {
    if (!phone) {
      return 'Please provide a phone number query parameter, e.g., /test-call?phone=+1234567890';
    }
    await this.twilioService.initiateCall(phone);
    return `Call initiated to ${phone}`;
  }
}
