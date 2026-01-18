import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText, Output } from 'ai';
import { z } from 'zod';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openrouter: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');

    if (!apiKey) {
      this.logger.warn('OPENROUTER_API_KEY not configured');
    }

    this.openrouter = createOpenRouter({
      apiKey: apiKey,
    });
  }

  async parseEmail(subject: string, body: string): Promise<{ isQualified: boolean; phoneNumber?: string }> {
    this.logger.log('Parsing email for qualification and phone number extraction...');

    try {
      // Using a model supported by OpenRouter
      const model = this.openrouter('openai/gpt-4o'); 

      const { output } = await generateText({
        model: model,
        output: Output.object({
          schema: z.object({
            isQualified: z.boolean().describe('Whether the lead meets all qualification criteria (e.g. valid phone, approved geography, service alignment).'),
            phoneNumber: z.string().describe('The extraction of the phone number if present. Format as E.164 if possible (e.g. +44...). Return empty string if not found.'),
            reason: z.string().describe('Short reason for qualification decision.'),
          }),
        }),
        prompt: `
          You are an email qualification agent for Ekron.
          Analyze the following email to determine if it is a qualified lead and extract the phone number.

          Qualification Criteria:
          1. Property location within approved geography (UK based, e.g., Ealing, Kensington, etc.).
          2. Service requested aligns with Ekron services.
          3. Indicative property value is reasonable.
          4. Valid phone number is present.

          Email Subject: "${subject}"
          Email Body:
          "${body}"
        `,
      });

      this.logger.log(`AI Analysis Result: Qualified=${output.isQualified}, Phone=${output.phoneNumber}, Reason=${output.reason}`);

      return {
        isQualified: output.isQualified,
        phoneNumber: output.phoneNumber === '' ? undefined : output.phoneNumber,
      };

    } catch (error) {
      this.logger.error('Failed to parse email with AI', error);
      return { isQualified: false };
    }
  }
}
