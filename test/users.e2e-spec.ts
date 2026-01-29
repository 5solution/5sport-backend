import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';

import { Role } from 'src/common/enums/role.enum';
import { AuthModule } from 'src/modules/auth/auth.module';
import { User } from 'src/modules/user/user.entity';
import { UserModule } from 'src/modules/user/user.module';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let userRepository: Repository<User>;

  const testUsers = [
    {
      email: 'admin@example.com',
      password: 'password123',
      displayName: 'Admin User',
      role: Role.ADMIN,
    },
    {
      email: 'organizer@example.com',
      password: 'password123',
      displayName: 'Organizer User',
      role: Role.ORGANIZER,
    },
    {
      email: 'user1@example.com',
      password: 'password123',
      displayName: 'Regular User 1',
      role: Role.USER,
    },
    {
      email: 'user2@example.com',
      password: 'password123',
      displayName: 'Regular User 2',
      role: Role.USER,
    },
    {
      email: 'user3@example.com',
      password: 'password123',
      displayName: 'Regular User 3',
      role: Role.USER,
    },
  ];

  let adminToken: string;
  let userToken: string;
  let organizerToken: string;

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

    jwtService = moduleFixture.get<JwtService>(JwtService);
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );

    // Create test users
    for (const userData of testUsers) {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData);

      // Update role for admin and organizer
      if (userData.role !== Role.USER) {
        await userRepository.update(
          { email: userData.email },
          { role: userData.role },
        );
      }
    }

    // Get tokens for different roles
    const adminResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'password123',
      });
    adminToken = adminResponse.body.token;

    const userResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'user1@example.com',
        password: 'password123',
      });
    userToken = userResponse.body.token;

    const organizerResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'organizer@example.com',
        password: 'password123',
      });
    organizerToken = organizerResponse.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users (GET)', () => {
    it('should return paginated users for admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('limit');
      expect(response.body.meta).toHaveProperty('totalItems');
      expect(response.body.meta).toHaveProperty('totalPages');
      expect(response.body.meta).toHaveProperty('hasNextPage');
      expect(response.body.meta).toHaveProperty('hasPreviousPage');
    });

    it('should return users without passwords', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.data.forEach((user: any) => {
        expect(user).not.toHaveProperty('password');
      });
    });

    it('should respect pagination parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/users?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.meta.limit).toBe(2);
      expect(response.body.meta.page).toBe(1);
    });

    it('should return second page correctly', async () => {
      const response = await request(app.getHttpServer())
        .get('/users?page=2&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.meta.page).toBe(2);
      expect(response.body.meta.hasPreviousPage).toBe(true);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer()).get('/users').expect(401);
    });

    it('should return 400 for invalid pagination', async () => {
      await request(app.getHttpServer())
        .get('/users?page=0')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should return 400 for limit exceeding maximum', async () => {
      await request(app.getHttpServer())
        .get('/users?limit=101')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('/users/me (GET)', () => {
    it('should return current user for regular user', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.email).toBe('user1@example.com');
      expect(response.body.role).toBe(Role.USER);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return current user for admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.email).toBe('admin@example.com');
      expect(response.body.role).toBe(Role.ADMIN);
    });

    it('should return current user for organizer', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.email).toBe('organizer@example.com');
      expect(response.body.role).toBe(Role.ORGANIZER);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer()).get('/users/me').expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should return 401 with expired token', async () => {
      // Create an expired token
      const expiredToken = jwtService.sign(
        { sub: 'user-uuid', email: 'test@example.com', role: Role.USER },
        { expiresIn: '-1h' },
      );

      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });
  });

  describe('User data integrity', () => {
    it('should include all required user fields', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('role');
    });

    it('should have correct role values', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const roles = response.body.data.map((user: any) => user.role);
      roles.forEach((role: string) => {
        expect([Role.ADMIN, Role.USER, Role.ORGANIZER]).toContain(role);
      });
    });
  });
});
