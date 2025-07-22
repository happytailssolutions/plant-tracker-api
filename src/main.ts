import { webcrypto } from 'crypto';
import { setDefaultResultOrder } from 'dns';

setDefaultResultOrder('ipv4first');
console.log('DNS result order has been set to ipv4first.');

global.crypto = webcrypto as any;
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('Starting bootstrap process...');
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
