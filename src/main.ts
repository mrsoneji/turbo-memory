import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

function isMongoConnectionError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const name = (err as { name?: string }).name;
  const message = (err as { message?: string }).message || '';
  return (
    name === 'MongoServerSelectionError' ||
    name === 'MongoNetworkError' ||
    message.includes('MongoServerSelectionError') ||
    message.includes('MongoNetworkError') ||
    message.includes('getaddrinfo ENOTFOUND')
  );
}

process.on('unhandledRejection', (reason) => {
  if (isMongoConnectionError(reason)) {
    console.warn('[Mongo] Connection issue (non-fatal). App will keep running.');
    return;
  }
  console.error('[UnhandledRejection]', reason);
});

process.on('uncaughtException', (err) => {
  if (isMongoConnectionError(err)) {
    console.warn('[Mongo] Connection issue (non-fatal). App will keep running.');
    return;
  }
  console.error('[UncaughtException]', err);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('NestJS Auth API')
    .setDescription('API for JWT authentication and users CRUD with roles.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3000;
  await app.listen(port);
}

bootstrap();
