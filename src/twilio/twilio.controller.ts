import {
  Controller,
  Post,
  Body,
  Res,
  Logger,
  HttpCode,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as express from 'express';
import { MailService } from '../mail/mail.service';
import { TwilioService } from './twilio.service';
import * as RetellTypes from './types/retell-webhook.types';

@Controller('twilio')
export class TwilioController {
  private readonly logger = new Logger(TwilioController.name);

  constructor(
    private twilioService: TwilioService,
    private mailService: MailService,
  ) {}

  @Post('retell-inbound')
  async retellInbound(
    @Body() body: RetellTypes.RetellInboundWebhookPayload,
  ): Promise<RetellTypes.RetellInboundWebhookResponse> {
    this.logger.log(
      `Retell inbound webhook body: ${JSON.stringify(body, null, 2)}`,
    );

    if (body.event === 'call_inbound' && body.call_inbound) {
      const { from_number, to_number } = body.call_inbound;
      this.logger.log(`Inbound call from ${from_number} to ${to_number}`);

      const routeToAI = this.twilioService.shouldRouteToAI();
      this.logger.log(`Route to AI result: ${routeToAI}`);

      return {
        call_inbound: {
          dynamic_variables: {
            caller_number: from_number,
            route_to_ai: String(routeToAI),
          },
          metadata: {
            source: 'inbound_webhook',
          },
        },
      };
    }

    this.logger.warn(`Unhandled inbound webhook event: ${body.event}`);
    return {};
  }

  @Post('retell-call-ended')
  @HttpCode(204)
  async retellCallEnded(
    @Body() body: RetellTypes.RetellCallEndedWebhookPayload,
  ): Promise<void> {
    this.logger.log(
      `Retell call ended: reason=${body.call.disconnection_reason}`,
    );

    if (body.call.disconnection_reason === 'call_transfer') {
      await this.mailService.sendCallNotification(
        body.call.from_number,
        'transferred_to_human',
      );
    }

    if (body.call.disconnection_reason === 'user_hangup') {
      await this.mailService.sendCallNotification(
        body.call.from_number,
        'user_hangup',
      );
    }
  }

  @Post('call-status')
  async callStatus(
    @Body() body: Record<string, string>,
    @Res() res: express.Response,
  ): Promise<void> {
    this.logger.log(`Call status: ${body.CallStatus} for ${body.CallSid}`);
    res.sendStatus(200);
  }
}
