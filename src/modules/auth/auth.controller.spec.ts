import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock express before importing the controller
vi.mock('express', () => ({
  Request: class Request {},
  Response: class Response {},
}));

import { Role } from '../../common/enums/role.enum';
import { User } from '../user/user.entity';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleTokenDto } from './dto/google-token.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockUser: Partial<User> = {
    id: 'user-uuid-1',
    email: 'test@example.com',
    displayName: 'Test User',
    role: Role.USER,
    tags: ['sports'],
    avatarUrl: 'https://example.com/avatar.jpg',
  };

  const mockAuthResponse = {
    user: mockUser,
    token: 'mock-jwt-token',
  };

  const mockAuthService = {
    register: vi.fn(),
    login: vi.fn(),
    authenticateWithGoogle: vi.fn(),
    generateToken: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a new user and return auth response', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
        displayName: 'New User',
        tags: ['fitness'],
      };

      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should handle registration without optional fields', async () => {
      const registerDto: RegisterDto = {
        email: 'minimal@example.com',
        password: 'password123',
      };

      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('login', () => {
    it('should login user and return auth response', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('googleAuthenticate', () => {
    it('should authenticate with Google ID token', async () => {
      const googleTokenDto: GoogleTokenDto = {
        idToken: 'valid-google-id-token',
      };

      mockAuthService.authenticateWithGoogle.mockResolvedValue(
        mockAuthResponse,
      );

      const result = await controller.googleAuthenticate(googleTokenDto);

      expect(authService.authenticateWithGoogle).toHaveBeenCalledWith(
        googleTokenDto,
      );
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('googleAuth', () => {
    it('should exist and be callable (guard handles redirect)', async () => {
      const result = await controller.googleAuth();
      expect(result).toBeUndefined();
    });
  });

  describe('googleAuthCallback', () => {
    it('should generate token and redirect to frontend', async () => {
      const mockReq = {
        user: mockUser,
      };

      const mockRes = {
        redirect: vi.fn(),
      } as { redirect: ReturnType<typeof vi.fn> };

      mockAuthService.generateToken.mockReturnValue('mock-jwt-token');

      // Store original env value
      const originalFrontendUrl = process.env.FRONTEND_URL;
      process.env.FRONTEND_URL = 'http://localhost:3000';

      await controller.googleAuthCallback(mockReq as any, mockRes as any);

      expect(authService.generateToken).toHaveBeenCalledWith(mockUser);
      expect(mockRes.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/auth/success?token=mock-jwt-token',
      );

      // Restore original env value
      process.env.FRONTEND_URL = originalFrontendUrl;
    });

    it('should use default frontend URL when env not set', async () => {
      const mockReq = {
        user: mockUser,
      };

      const mockRes = {
        redirect: vi.fn(),
      } as { redirect: ReturnType<typeof vi.fn> };

      mockAuthService.generateToken.mockReturnValue('mock-jwt-token');

      // Store and clear env value
      const originalFrontendUrl = process.env.FRONTEND_URL;
      delete process.env.FRONTEND_URL;

      await controller.googleAuthCallback(mockReq as any, mockRes as any);

      expect(mockRes.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/auth/success?token=mock-jwt-token',
      );

      // Restore original env value
      process.env.FRONTEND_URL = originalFrontendUrl;
    });
  });

  describe('getProfile', () => {
    it('should return the current user from JWT', () => {
      const result = controller.getProfile(mockUser as User);

      expect(result).toEqual(mockUser);
    });
  });

  describe('adminOnly', () => {
    it('should return admin access granted message', () => {
      const result = controller.adminOnly();

      expect(result).toEqual({ message: 'Admin access granted' });
    });
  });

  describe('organizerDashboard', () => {
    it('should return organizer access granted message', () => {
      const result = controller.organizerDashboard();

      expect(result).toEqual({ message: 'Organizer access granted' });
    });
  });
});
