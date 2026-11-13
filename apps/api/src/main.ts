import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS configuration
  const allowedOrigins: (string | RegExp)[] = [
    'http://localhost:3005',
    'http://localhost:3000',
    'http://localhost:3002',
    /\.vercel\.app$/,
  ];
  if (process.env.APP_URL) {
    allowedOrigins.push(process.env.APP_URL);
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Cookie parser
  app.use(cookieParser());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('TeamTrack API')
    .setDescription('Multi-tenant Project Workforce Management Platform API')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('teams', 'Team management')
    .addTag('users', 'User management')
    .addTag('platform-admin', 'Platform administration')
    .addCookieAuth('session')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.enableShutdownHooks();

  const port = process.env.PORT || process.env.API_PORT || 3001;
  let retries = 5;
  while (retries > 0) {
    try {
      await app.listen(port);
      break;
    } catch (err: any) {
      if (err?.code === 'EADDRINUSE' && retries > 1) {
        console.warn(`⚠️ Port ${port} is busy, retrying in 1s... (${retries - 1} attempts left)`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        retries--;
      } else {
        throw err;
      }
    }
  }

  console.log(`\n🚀 TeamTrack API running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs\n`);
}

bootstrap();
