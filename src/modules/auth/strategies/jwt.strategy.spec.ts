import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { Role } from '../../../common/enums/role.enum';
import { AuthService } from '../auth.service';

import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let authService: AuthService;
  let configService: ConfigService;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'test@example.com',
    displayName: 'Test User',
    role: Role.USER,
    tags: ['sports'],
  };

  const mockAuthService = {
    validateUserById: vi.fn(),
  };

  const mockConfigService = {
    get: vi.fn().mockReturnValue('test-jwt-secret'),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    authService = module.get<AuthService>(AuthService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('constructor', () => {
    it('should use the JWT secret from config service', () => {
      expect(configService.get).toHaveBeenCalledWith(
        'JWT_SECRET',
        'your-secret-key',
      );
    });
  });

  describe('validate', () => {
    it('should return user for valid payload', async () => {
      const payload = {
        sub: 'user-uuid-1',
        email: 'test@example.com',
        role: Role.USER,
      };

      mockAuthService.validateUserById.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(authService.validateUserById).toHaveBeenCalledWith(payload.sub);
      expect(result).toEqual(mockUser);
    });

    it('should return null for invalid user id', async () => {
      const payload = {
        sub: 'non-existent-uuid',
        email: 'test@example.com',
        role: Role.USER,
      };

      mockAuthService.validateUserById.mockResolvedValue(null);

      const result = await strategy.validate(payload);

      expect(authService.validateUserById).toHaveBeenCalledWith(payload.sub);
      expect(result).toBeNull();
    });

    it('should validate admin user', async () => {
      const payload = {
        sub: 'admin-uuid',
        email: 'admin@example.com',
        role: Role.ADMIN,
      };

      const adminUser = {
        ...mockUser,
        id: 'admin-uuid',
        email: 'admin@example.com',
        role: Role.ADMIN,
      };

      mockAuthService.validateUserById.mockResolvedValue(adminUser);

      const result = await strategy.validate(payload);

      expect(result.role).toBe(Role.ADMIN);
    });

    it('should validate organizer user', async () => {
      const payload = {
        sub: 'organizer-uuid',
        email: 'organizer@example.com',
        role: Role.ORGANIZER,
      };

      const organizerUser = {
        ...mockUser,
        id: 'organizer-uuid',
        email: 'organizer@example.com',
        role: Role.ORGANIZER,
      };

      mockAuthService.validateUserById.mockResolvedValue(organizerUser);

      const result = await strategy.validate(payload);

      expect(result.role).toBe(Role.ORGANIZER);
    });
  });
});
