import { Controller, Post, Body, Res, HttpCode, Logger } from '@nestjs/common';
import * as express from 'express';
import { twiml } from 'twilio';
import { TwilioService } from './twilio.service';

interface TransferResultBody {
  DialCallStatus: string;
}

interface CallStatusBody {
  CallStatus: string;
  To: string;
}

@Controller('twilio')
export class TwilioController {
  private readonly logger = new Logger(TwilioController.name);

  constructor(private twilioService: TwilioService) {}

  @Post('call-status')
  @HttpCode(200)
  callStatus(@Body() body: CallStatusBody): void {
    this.logger.log(`Received webhook: /call-status. Status: ${body.CallStatus}, To: ${body.To}`);
    
    if (body.CallStatus === 'no-answer') {
      this.logger.warn(`Call was not answered by lead ${body.To}. Triggering retry logic.`);
      this.twilioService.scheduleRetry(body.To);
    } else if (body.CallStatus === 'completed') {
      this.logger.log(`Call completed successfully.`);
    } else if (body.CallStatus === 'failed' || body.CallStatus === 'busy') {
      this.logger.warn(`Call failed or busy. Status: ${body.CallStatus}`);
    }
  }

  @Post('router')
  async router(@Body() body: any, @Res() res: express.Response): Promise<void> {
    this.logger.log(`Received webhook: /router.`);
    this.logger.log(`Full Request Body: ${JSON.stringify(body, null, 2)}`);
    
    const response = new twiml.VoiceResponse();
    const isBusinessHours = this.twilioService.isBusinessHours();

    this.logger.log(`Checking Business Hours... Result: ${isBusinessHours}`);

    if (isBusinessHours) {
      try {
        const callId = await this.twilioService.registerRetellCall(body.CallSid, 'inbound');
        
        const dial = response.dial();
        dial.sip(`sip:${callId}@sip.retellai.com`); 
      } catch (error) {
        this.logger.error('Failed to route to Retell AI.', error.stack);
        this.dialPhoneNumber(response);
      }
    } else {
      this.logger.log('After hours detected. Routing to backup phone number.');
      this.dialPhoneNumber(response);
    }

    res.type('text/xml').send(response.toString());
  }

  private dialPhoneNumber(response: twiml.VoiceResponse): void {
    const phoneNumber = this.twilioService.getAgentPhone();
    if (phoneNumber) {
      this.logger.log(`Dialing number: ${phoneNumber}`);
      const dial = response.dial();
      dial.number(phoneNumber);
    } else {
      this.logger.warn('No agent number configured');
      response.say('No agent number configured.');
    }
  }
}
