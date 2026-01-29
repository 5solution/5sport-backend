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

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const testUser = {
    email: 'test@example.com',
    password: 'password123',
    displayName: 'Test User',
    tags: ['sports', 'fitness'],
  };

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
          dropSchema: true, // Clean database before tests
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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.displayName).toBe(testUser.displayName);
      expect(response.body.user.role).toBe(Role.USER);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 409 for duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409);
    });

    it('should return 400 for invalid email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);
    });

    it('should return 400 for short password', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'newuser@example.com',
          password: '123',
        })
        .expect(400);
    });

    it('should register user without optional fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'minimal@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(response.body.user.email).toBe('minimal@example.com');
      expect(response.body.user.tags).toEqual([]);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
    });

    it('should return 401 for invalid password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should return 401 for non-existent user', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);
    });

    it('should return 400 for missing email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          password: 'password123',
        })
        .expect(400);
    });
  });

  describe('/auth/profile (GET)', () => {
    let authToken: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      authToken = response.body.token;
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.email).toBe(testUser.email);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer()).get('/auth/profile').expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('/auth/admin/users (GET) - RBAC', () => {
    let userToken: string;
    let _adminToken: string;

    beforeAll(async () => {
      // Login as regular user
      const userResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      userToken = userResponse.body.token;

      // Create admin user manually with admin role
      // We'll generate a token for an admin user
      adminToken = jwtService.sign({
        sub: 'admin-uuid',
        email: 'admin@example.com',
        role: Role.ADMIN,
      });
    });

    it('should return 403 for regular user', async () => {
      await request(app.getHttpServer())
        .get('/auth/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer()).get('/auth/admin/users').expect(401);
    });
  });

  describe('/auth/organizer/dashboard (GET) - RBAC', () => {
    let userToken: string;
    let _organizerToken: string;

    beforeAll(async () => {
      // Login as regular user
      const userResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      userToken = userResponse.body.token;

      // Generate organizer token
      organizerToken = jwtService.sign({
        sub: 'organizer-uuid',
        email: 'organizer@example.com',
        role: Role.ORGANIZER,
      });
    });

    it('should return 403 for regular user', async () => {
      await request(app.getHttpServer())
        .get('/auth/organizer/dashboard')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('/auth/google/authenticate (POST)', () => {
    it('should return 401 for invalid Google token', async () => {
      await request(app.getHttpServer())
        .post('/auth/google/authenticate')
        .send({
          idToken: 'invalid-google-token',
        })
        .expect(401);
    });

    it('should return 400 for missing idToken', async () => {
      await request(app.getHttpServer())
        .post('/auth/google/authenticate')
        .send({})
        .expect(400);
    });
  });
});
