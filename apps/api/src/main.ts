import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { ensureUploadsDir } from './group-notes/upload-storage';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

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
    allowedHeaders: ['Content-Type', 'X-User-Id'],
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
  console.log(`ClassTrack API listening on http://localhost:${port}/api`);
}
bootstrap();
