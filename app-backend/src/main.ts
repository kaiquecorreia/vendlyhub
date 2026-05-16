import 'dotenv/config';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { mkdirSync } from 'fs';
import {
  AVATARS_UPLOAD_DIR,
  LOGOS_UPLOAD_DIR,
  PRODUCTS_UPLOAD_DIR,
  UPLOADS_ROOT,
} from './upload-paths';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export async function bootstrap() {
  mkdirSync(LOGOS_UPLOAD_DIR, { recursive: true });
  mkdirSync(AVATARS_UPLOAD_DIR, { recursive: true });
  mkdirSync(PRODUCTS_UPLOAD_DIR, { recursive: true });

  // Register static files BEFORE Nest mounts routes; otherwise Nest's 404 runs first and never serves files.
  const server = express();
  server.use('/uploads', express.static(UPLOADS_ROOT));

  const adapter = new ExpressAdapter(server);
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    adapter,
  );

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Vendlyhub API')
    .setDescription('API for managing investment portfolios')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap()
  .then()
  .catch((error) => console.error(error));
