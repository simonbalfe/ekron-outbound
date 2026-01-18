import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  console.log('--- Environment Variables ---');
  console.log('PORT:', process.env.PORT);
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '********' : 'NOT SET');
  console.log('-----------------------------');

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
