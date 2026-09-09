import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Logger,
  Post,
} from '@nestjs/common';
import { MailService } from './mail.service';
import type * as ContactEmailTypes from './types/contact-email.types';
import { parseRetellEmailWebhook } from './types/retell-email-webhook.types';
import type * as SurveyorEmailTypes from './types/surveyor-email.types';

@Controller('mail')
export class MailController {
  private readonly logger = new Logger(MailController.name);

  constructor(private mailService: MailService) {}

  @Post('retell-send-email')
  @HttpCode(200)
  async retellSendEmail(@Body() body: unknown): Promise<{ success: boolean }> {
    const payload = parseRetellEmailWebhook(body);
    if (!payload) {
      this.logger.warn(
        'Rejected Retell email webhook with unsupported outcome',
      );
      throw new BadRequestException('Unsupported call outcome');
    }

    this.logger.log(
      `Retell email webhook: caller=${payload.callerNumber}, outcome=${payload.outcome}`,
    );

    await this.mailService.sendCallNotification(
      payload.callerNumber,
      payload.outcome,
    );

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
