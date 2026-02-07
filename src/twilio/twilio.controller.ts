import { Controller, Post, Body, Res, Logger } from '@nestjs/common';
import * as express from 'express';
import { twiml } from 'twilio';
import { MailService } from '../mail/mail.service';
import { TwilioService } from './twilio.service';

@Controller('twilio')
export class TwilioController {
  private readonly logger = new Logger(TwilioController.name);

  constructor(
    private twilioService: TwilioService,
    private mailService: MailService,
  ) {}

  @Post('router')
  async router(@Body() body: Record<string, string>, @Res() res: express.Response): Promise<void> {
    this.logger.log(`Received webhook: /router.`);
    this.logger.log(`Full Request Body: ${JSON.stringify(body, null, 2)}`);
    
    const response = new twiml.VoiceResponse();
    const shouldRouteToAI = this.twilioService.shouldRouteToAI();
    const callerNumber = body.From || 'Unknown';

    this.logger.log(`Should route to AI: ${shouldRouteToAI}`);

    if (true) {
      try {
        const fromNumber = body.From || '';
        const toNumber = body.To || '';
        const callId = await this.twilioService.registerRetellCall(body.CallSid, 'inbound', fromNumber, toNumber);
        
        const dial = response.dial();
        dial.sip(`sip:${callId}@sip.retellai.com`);

        this.mailService.sendCallNotification(callerNumber, 'connected_ai');
      } catch (error) {
        this.logger.error('Failed to route to Retell AI.', (error as Error).stack);
      }
    } else {
      this.logger.log('In-hours detected. Routing to human agent.');
      this.dialPhoneNumber(response);
    }

    res.type('text/xml').send(response.toString());
  }

  @Post('dial-status')
  async dialStatus(
    @Body() body: Record<string, string>,
    @Res() res: express.Response,
  ): Promise<void> {
    const dialCallStatus = body.DialCallStatus;
    const callerNumber = body.From || 'Unknown';
    this.logger.log(`Dial status received: ${dialCallStatus}`);

    const response = new twiml.VoiceResponse();

    if (dialCallStatus === 'completed') {
      this.mailService.sendCallNotification(callerNumber, 'connected_human');
    } else {
      try {
        const fromNumber = body.From || '';
        const toNumber = body.To || '';
        const callId = await this.twilioService.registerRetellCall(body.CallSid, 'inbound', fromNumber, toNumber);

        this.logger.log(`Primary agent unavailable (${dialCallStatus}). Routing to SIP agent.`);
        const dial = response.dial();
        dial.sip(`sip:${callId}@sip.retellai.com`);

        this.mailService.sendCallNotification(callerNumber, 'human_no_answer_forwarded_ai');
      } catch (error) {
        this.logger.error('Failed to route to SIP agent as backup.', (error as Error).stack);
        response.say('We are unable to connect your call at this time. Please try again later.');
      }
    }

    res.type('text/xml').send(response.toString());
  }

  private dialPhoneNumber(response: twiml.VoiceResponse): void {
    const phoneNumber = this.twilioService.getAgentPhone();
    if (phoneNumber) {
      this.logger.log(`Dialing number: ${phoneNumber}`);
      const dial = response.dial({ action: '/twilio/dial-status', timeout: 30 });
      dial.number(phoneNumber);
    } else {
      this.logger.warn('No agent number configured');
      response.say('No agent number configured.');
    }
  }
}
