import { Controller, Post, Body, Logger, HttpCode } from '@nestjs/common';
import { MailService } from './mail.service';
import * as RetellEmailTypes from './types/retell-email-webhook.types';

@Controller('mail')
export class MailController {
  private readonly logger = new Logger(MailController.name);

  constructor(private mailService: MailService) {}

  @Post('retell-send-email')
  @HttpCode(200)
  async retellSendEmail(
    @Body() body: RetellEmailTypes.RetellEmailWebhookPayload,
  ): Promise<{ success: boolean }> {

    const { caller_number } = body.call.retell_llm_dynamic_variables;
    const { outcome } = body.args;

    this.logger.log(
      `Retell email webhook: caller=${caller_number}, outcome=${outcome}`,
    );

    await this.mailService.sendCallNotification(caller_number, outcome);

    return { success: true };
  }
}
