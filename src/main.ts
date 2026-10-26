import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

const SENSITIVE_PATTERNS = ['PASSWORD', 'SECRET', 'TOKEN', 'KEY'];

const ENV_KEYS = [
  'PORT',
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_EMAIL_API_TOKEN',
  'RECIPIENT_EMAIL',
  'SENDER_EMAIL',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'USE_BUSINESS_HOURS',
];

function logEnvironmentVariables(logger: Logger): void {
  logger.log('--- Environment Variables ---');
  for (const key of ENV_KEYS) {
    const rawValue = process.env[key];
    if (rawValue === undefined) {
      logger.warn(`${key}: NOT SET`);
      continue;
    }
    const isSensitive = SENSITIVE_PATTERNS.some((pattern) =>
      key.includes(pattern),
    );
    const displayValue = isSensitive ? '********' : rawValue;
    logger.log(`${key}: ${displayValue}`);
  }
  logger.log('-----------------------------');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });
  app.enableCors();

  const logger = new Logger('Bootstrap');
  logEnvironmentVariables(logger);

  const port = process.env.PORT!;
  await app.listen(port);
  logger.log(`Application listening on port ${port}`);
}
void bootstrap();
