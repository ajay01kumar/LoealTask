import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable Cross-Origin Resource Sharing (CORS) for React frontend
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Enforce DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`🚀 L'Oréal Claims Intelligence Engine Backend running on: http://localhost:${port}`);
  logger.log(`📋 Assessment endpoint active at: POST http://localhost:${port}/api/claims/assess`);
}

bootstrap();

