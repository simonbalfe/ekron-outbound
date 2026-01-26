import { Controller, Post, Body, Res, Logger } from '@nestjs/common';
import * as express from 'express';
import { twiml } from 'twilio';
import { TwilioService } from './twilio.service';

@Controller('twilio')
export class TwilioController {
  private readonly logger = new Logger(TwilioController.name);

  constructor(private twilioService: TwilioService) {}

  @Post('router')
  async router(@Body() body: any, @Res() res: express.Response): Promise<void> {
    this.logger.log(`Received webhook: /router.`);
    this.logger.log(`Full Request Body: ${JSON.stringify(body, null, 2)}`);
    
    const response = new twiml.VoiceResponse();
    const shouldRouteToAI = this.twilioService.shouldRouteToAI();

    this.logger.log(`Should route to AI: ${shouldRouteToAI}`);

    if (shouldRouteToAI) {
      try {
        const fromNumber = body.From || '';
        const toNumber = body.To || '';
        const callId = await this.twilioService.registerRetellCall(body.CallSid, 'inbound', fromNumber, toNumber);
        
        const dial = response.dial();
        dial.sip(`sip:${callId}@sip.retellai.com`); 
      } catch (error) {
        this.logger.error('Failed to route to Retell AI.', error.stack);
      }
    } else {
      this.logger.log('In-hours detected. Routing to human agent.');
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
