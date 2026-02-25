import { join } from 'path';

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

// Set up your API key

import { env } from './config';
import { AppModule } from './modules/app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { httpLogger } from './common/middlewares/logger.middleware';

const setMiddleware = (app: NestExpressApplication) => {
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.enableCors({
    credentials: true,
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: '*',
  });

  app.use(httpLogger);

  app.use(compression());

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
};

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new Logger('[]'),
  });
  app.useLogger(new Logger('APP'));
  const logger = new Logger('APP');

  // Serve static files from public directory
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/',
  });

  setMiddleware(app);

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('5Sport API')
      .setDescription(
        'API documentation for 5Sport authentication and services',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
        'JWT-auth',
      )
      .build();

    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig, {
      deepScanRoutes: true,
    });
    SwaggerModule.setup('swagger', app, swaggerDocument, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
      },
    });

    app.use('/swagger/json', (req, res) => {
      res.json(swaggerDocument);
    });
  }

  await app.startAllMicroservices();

  await app.listen(env.port, () =>
    logger.warn(
      `> Listening App on port ${env.port} 
app running on http://localhost:${env.port}
Swagger docs available at http://localhost:${env.port}/swagger
      `,
    ),
  );
}

bootstrap();
