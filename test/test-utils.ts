import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from 'src/common/enums/role.enum';
import { AuthModule } from 'src/modules/auth/auth.module';
import { User } from 'src/modules/user/user.entity';
import { UserModule } from 'src/modules/user/user.module';
import * as request from 'supertest';

export interface TestContext {
  app: INestApplication;
  jwtService: JwtService;
  adminToken: string;
  userToken: string;
  organizerToken: string;
}

export async function createTestApp(): Promise<INestApplication> {
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

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.init();
  return app;
}

export async function createUserWithRole(
  app: INestApplication,
  email: string,
  password: string,
  role: Role,
): Promise<string> {
  // Register user
  await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      email,
      password,
      displayName: `${role} User`,
    });

  // Login to get token
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password });

  return response.body.token;
}

export function generateToken(
  jwtService: JwtService,
  userId: string,
  email: string,
  role: Role,
): string {
  return jwtService.sign({
    sub: userId,
    email,
    role,
  });
}

export const testUsers = {
  admin: {
    email: 'admin@test.com',
    password: 'password123',
    displayName: 'Admin User',
    role: Role.ADMIN,
  },
  organizer: {
    email: 'organizer@test.com',
    password: 'password123',
    displayName: 'Organizer User',
    role: Role.ORGANIZER,
  },
  user: {
    email: 'user@test.com',
    password: 'password123',
    displayName: 'Regular User',
    role: Role.USER,
  },
};
