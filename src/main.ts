import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module.js';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Cookie parsing middleware
  app.use(cookieParser());

  // Strict CORS
  const corsOrigins = (
    process.env.CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000'
  )
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-CSRF-Token',
      'Accept',
    ],
  });

  // Global API Version Prefix
  app.setGlobalPrefix('api/v1', {
    exclude: ['api/docs', 'api/docs-json', ''],
  });

  // Global Exception Filter
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  // OpenAPI / Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('CampusCare Backend API')
    .setDescription(
      'Enterprise University Maintenance Management Platform REST API — Multi-Tenant Backend',
    )
    .setVersion('1.0')
    .addCookieAuth('campuscare_session', {
      type: 'apiKey',
      in: 'cookie',
      name: 'campuscare_session',
      description: 'HttpOnly Session Cookie',
    })
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'Token',
      description: 'Optional Bearer Token for non-browser API clients',
    })
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = Number(process.env.PORT) || 3001;
  await app.listen(port);

  console.log(`\n======================================================`);
  console.log(` CampusCare Backend is live on: http://localhost:${port}`);
  console.log(` API Base Prefix: http://localhost:${port}/api/v1`);
  console.log(` Swagger API Docs: http://localhost:${port}/api/docs`);
  console.log(` Health Endpoint: http://localhost:${port}/api/v1/health`);
  console.log(`======================================================\n`);
}

await bootstrap();
