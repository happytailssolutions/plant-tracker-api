const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');
const functions = require('firebase-functions');
const { AppModule } = require('./dist/src/app.module');

let app;

async function bootstrap() {
  if (!app) {
    app = await NestFactory.create(AppModule, new ExpressAdapter());
    await app.init();
  }
  return app;
}

exports.api = functions.https.onRequest(async (req, res) => {
  const app = await bootstrap();
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp(req, res);
});
