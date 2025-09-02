import { webcrypto } from 'crypto';
import { setDefaultResultOrder } from 'dns';

setDefaultResultOrder('ipv4first');
console.log('DNS result order has been set to ipv4first.');

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
global.crypto = webcrypto as any;
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // Add version logging to help debug deployment issues
  const version = '0a1af2e'; // This should match your git commit
  console.log(`🚀 Plant Tracker API starting - Version: ${version}`);
  console.log(`🚀 Build timestamp: ${new Date().toISOString()}`);

  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `🚀 Plant Tracker API running on port 3000 - Version: ${version}`,
  );
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
