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
    const name = body.args?.name ?? 'Unknown';
    const phone = body.args?.phone ?? '+0000000000';

    this.logger.log(`Contact email webhook: name=${name}, phone=${phone}`);

    await this.mailService.sendContactEmail({
      ...body.args,
      name,
      phone,
    });

    return { success: true };
  }

  @Post('send-email-surveyor')
  @HttpCode(200)
  async sendSurveyorEmail(
    @Body() body: SurveyorEmailTypes.SurveyorEmailWebhookPayload,
  ): Promise<{ success: boolean }> {
    const phone = body.args?.phone ?? '+0000000000';

    this.logger.log(`Surveyor email webhook: phone=${phone}`);

    await this.mailService.sendSurveyorEmail({
      ...body.args,
      phone,
    });

    return { success: true };
  }
}
