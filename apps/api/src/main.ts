import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { config as loadEnv } from 'dotenv';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { ensureUploadsDir } from './group-notes/upload-storage';

// Load apps/api/.env before reading MAILJET_* / APP_ENV / etc.
loadEnv({ path: join(__dirname, '..', '.env') });

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));

  app.use(
    helmet({
      // API JSON: no need for restrictive CSP of a browser app
      contentSecurityPolicy: false,
      // Allow <img> from the Vite app to load /api/uploads/*
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'PATCH', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'X-User-Id',
      'X-Request-Id',
      'X-Correlation-Id',
    ],
    exposedHeaders: ['X-Request-Id'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  ensureUploadsDir();
  // Served under global prefix: /api/uploads/group-notes/<file>
  app.useStaticAssets(join(process.cwd(), 'uploads', 'group-notes'), {
    prefix: '/api/uploads/group-notes',
  });

  app.setGlobalPrefix('api');
  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  const logger = await app.resolve(Logger);
  logger.log(
    `ClassTrack API listening on http://localhost:${port}/api (env=${process.env.APP_ENV || 'develop'}, logToFile=${(process.env.LOG_TO_FILE || '1') !== '0'})`,
  );
}
bootstrap();
