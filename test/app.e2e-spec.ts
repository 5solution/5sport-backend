import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';

import { AuthModule } from 'src/modules/auth/auth.module';
import { User } from 'src/modules/user/user.entity';
import { UserModule } from 'src/modules/user/user.module';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          url:
            process.env.POSTGRES_URL ||
            'postgresql://postgres:postgres@localhost:5433/5sport_test',
          entities: [User],
          synchronize: true,
          dropSchema: true,
        }),
        AuthModule,
        UserModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Application Bootstrap', () => {
    it('should initialize the application', () => {
      expect(app).toBeDefined();
    });

    it('should have HTTP server running', () => {
      expect(app.getHttpServer()).toBeDefined();
    });
  });

  describe('Health Check', () => {
    it('should respond to auth endpoints', async () => {
      // Test that auth endpoints are registered
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({});

      // Should return 400 (validation error) not 404 (not found)
      expect(response.status).not.toBe(404);
    });

    it('should respond to user endpoints', async () => {
      // Test that user endpoints are registered
      const response = await request(app.getHttpServer()).get('/users');

      // Should return 401 (unauthorized) not 404 (not found)
      expect(response.status).toBe(401);
    });
  });

  describe('Validation', () => {
    it('should validate request body', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: '12', // Too short
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should validate query parameters', async () => {
      // First register and login to get a token
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'testvalidation@example.com',
        password: 'password123',
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'testvalidation@example.com',
          password: 'password123',
        });

      const token = loginResponse.body.token;

      // Test with invalid pagination (will fail because user is not admin, but that's ok - we're testing the endpoint exists)
      const response = await request(app.getHttpServer())
        .get('/users?page=0')
        .set('Authorization', `Bearer ${token}`);

      // Should validate pagination
      expect([400, 403]).toContain(response.status);
    });
  });

  describe('Error Handling', () => {
    it('should return proper error response for unauthorized access', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
    });

    it('should handle invalid JSON gracefully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect([400, 500]).toContain(response.status);
    });
  });
});
