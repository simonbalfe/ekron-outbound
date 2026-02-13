import { Controller, Post, Body, Logger, HttpCode } from '@nestjs/common';
import { MailService } from './mail.service';
import * as ContactEmailTypes from './types/contact-email.types';
import * as RetellEmailTypes from './types/retell-email-webhook.types';
import * as SurveyorEmailTypes from './types/surveyor-email.types';

@Controller('mail')
export class MailController {
  private readonly logger = new Logger(MailController.name);

  constructor(private mailService: MailService) {}

  @Post('retell-send-email')
  @HttpCode(200)
  async retellSendEmail(
    @Body() body: RetellEmailTypes.RetellEmailWebhookPayload,
  ): Promise<{ success: boolean }> {
    const caller_number =
      body.call.retell_llm_dynamic_variables?.caller_number ?? '+0000000000';
    const outcome = body.args.outcome;

    this.logger.log(
      `Retell email webhook: caller=${caller_number}, outcome=${outcome}`,
    );

    await this.mailService.sendCallNotification(caller_number, outcome);

    return { success: true };
  }

  @Post('send-email')
  @HttpCode(200)
  async sendContactEmail(
    @Body() body: ContactEmailTypes.ContactEmailWebhookPayload,
  ): Promise<{ success: boolean }> {
    this.logger.log(
      `Contact email webhook: name=${body.args.name}, phone=${body.args.phone}`,
    );

    await this.mailService.sendContactEmail(body.args);

    return { success: true };
  }

  @Post('send-email-surveyor')
  @HttpCode(200)
  async sendSurveyorEmail(
    @Body() body: SurveyorEmailTypes.SurveyorEmailWebhookPayload,
  ): Promise<{ success: boolean }> {
    this.logger.log(`Surveyor email webhook: phone=${body.args.phone}`);

    await this.mailService.sendSurveyorEmail(body.args);

    return { success: true };
  }
}
