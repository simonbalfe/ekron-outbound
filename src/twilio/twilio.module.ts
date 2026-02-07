import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { TwilioController } from './twilio.controller';
import { TwilioService } from './twilio.service';

@Module({
  imports: [MailModule],
  controllers: [TwilioController],
  providers: [TwilioService],
  exports: [TwilioService],
})
export class TwilioModule {}
