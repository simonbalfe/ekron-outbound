import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';

function loadDotenvKeys(): string[] {
  const dotenvPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(dotenvPath)) {
    return [];
  }
  const lines = fs.readFileSync(dotenvPath, 'utf8').split('\n');
  const keys: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) {
      continue;
    }
    const key = trimmed.slice(0, eqIndex).trim();
    if (key) {
      keys.push(key);
    }
  }
  return keys;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const dotenvKeys = loadDotenvKeys();
  console.log('--- .env Variables ---');
  dotenvKeys
    .sort()
    .forEach((key) => {
      if (typeof process.env[key] === 'string') {
        const isSensitive =
          key.includes('PASSWORD') ||
          key.includes('SECRET') ||
          key.includes('TOKEN') ||
          key.includes('KEY');
        const value = isSensitive
          ? (process.env[key] ? '********' : 'NOT SET')
          : process.env[key];
        console.log(`${key}: ${value}`);
      }
    });
  console.log('----------------------');

  await app.listen(process.env.PORT!);
}
bootstrap();
