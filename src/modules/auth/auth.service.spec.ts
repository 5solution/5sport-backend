import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { Role } from '../../common/enums/role.enum';
import { BotService } from '../bot/bot.service';
import { User } from '../user/user.entity';

import { AuthService } from './auth.service';

// Create mock functions
const mockBcryptHash = vi.fn();
const mockBcryptCompare = vi.fn();

// Mock bcrypt
vi.mock('bcrypt', () => ({
  default: {
    hash: (...args: unknown[]) => mockBcryptHash(...args),
    compare: (...args: unknown[]) => mockBcryptCompare(...args),
  },
  hash: (...args: unknown[]) => mockBcryptHash(...args),
  compare: (...args: unknown[]) => mockBcryptCompare(...args),
}));

// Mock google-auth-library
const mockVerifyIdToken = vi.fn();
vi.mock('google-auth-library', () => {
  return {
    OAuth2Client: class MockOAuth2Client {
      verifyIdToken = mockVerifyIdToken;
    },
  };
});

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'test@example.com',
    password: 'hashedPassword123',
    displayName: 'Test User',
    role: Role.USER,
    tags: ['sports'],
    googleId: null as string | null,
    avatarUrl: null as string | null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockUserRepository = {
    findOne: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    findAndCount: vi.fn(),
  };

  const mockJwtService = {
    sign: vi.fn().mockReturnValue('mock-jwt-token'),
  };

  const mockBotService = {
    sendToTargetGroup: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: BotService,
          useValue: mockBotService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('register', () => {
    const registerDto = {
      email: 'newuser@example.com',
      password: 'password123',
      displayName: 'New User',
      tags: ['fitness'],
    };

    it('should successfully register a new user', async () => {
      const hashedPassword = 'hashedPassword';
      const createdUser = {
        ...mockUser,
        id: 'new-user-uuid',
        email: registerDto.email,
        displayName: registerDto.displayName,
        tags: registerDto.tags,
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockBcryptHash.mockResolvedValue(hashedPassword);
      mockUserRepository.create.mockReturnValue(createdUser);
      mockUserRepository.save.mockResolvedValue(createdUser);

      const result = await service.register(registerDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(mockBcryptHash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: registerDto.email,
        password: hashedPassword,
        displayName: registerDto.displayName,
        tags: registerDto.tags,
        role: Role.USER,
      });
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('token', 'mock-jwt-token');
      expect(result.user.email).toBe(registerDto.email);
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
    });

    it('should use empty array for tags if not provided', async () => {
      const registerDtoWithoutTags = {
        email: 'newuser@example.com',
        password: 'password123',
        displayName: 'New User',
      };

      const createdUser = {
        ...mockUser,
        tags: [],
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockBcryptHash.mockResolvedValue('hashedPassword');
      mockUserRepository.create.mockReturnValue(createdUser);
      mockUserRepository.save.mockResolvedValue(createdUser);

      await service.register(registerDtoWithoutTags);

      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ tags: [] }),
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login a user with valid credentials', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockBcryptCompare.mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(mockBcryptCompare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(result).toHaveProperty('token', 'mock-jwt-token');
      expect(result.user.email).toBe(loginDto.email);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for user without password (OAuth user)', async () => {
      const oauthUser = { ...mockUser, password: null };
      mockUserRepository.findOne.mockResolvedValue(oauthUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockBcryptCompare.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user without password for valid credentials', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockBcryptCompare.mockResolvedValue(true);

      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );

      expect(result).toBeDefined();
      expect(result.password).toBeUndefined();
      expect(result.email).toBe(mockUser.email);
    });

    it('should return null for non-existent user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser(
        'nonexistent@example.com',
        'password123',
      );

      expect(result).toBeNull();
    });

    it('should return null for invalid password', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockBcryptCompare.mockResolvedValue(false);

      const result = await service.validateUser(
        'test@example.com',
        'wrongpassword',
      );

      expect(result).toBeNull();
    });

    it('should return null for user without password', async () => {
      const oauthUser = { ...mockUser, password: null };
      mockUserRepository.findOne.mockResolvedValue(oauthUser);

      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );

      expect(result).toBeNull();
    });
  });

  describe('generateToken', () => {
    it('should generate a JWT token with correct payload', () => {
      const result = service.generateToken(mockUser as User);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(result).toBe('mock-jwt-token');
    });
  });

  describe('validateUserById', () => {
    it('should return user without password for valid id', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUserById('user-uuid-1');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-uuid-1' },
      });
      expect(result).toBeDefined();
      expect((result as any)?.password).toBeUndefined();
    });

    it('should return null for non-existent user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUserById('non-existent-uuid');

      expect(result).toBeNull();
    });
  });

  describe('findOrCreateGoogleUser', () => {
    const googleProfile = {
      id: 'google-id-123',
      emails: [{ value: 'google@example.com' }],
      displayName: 'Google User',
      photos: [{ value: 'https://example.com/photo.jpg' }],
    } as any;

    it('should return existing user by googleId', async () => {
      const existingUser = {
        ...mockUser,
        googleId: googleProfile.id,
      };
      mockUserRepository.findOne.mockResolvedValue(existingUser);

      const result = await service.findOrCreateGoogleUser(googleProfile);

      expect(result).toEqual(existingUser);
    });

    it('should update existing user found by email and link googleId', async () => {
      const existingUserByEmail = { ...mockUser, googleId: null };

      mockUserRepository.findOne
        .mockResolvedValueOnce(null) // First call: find by googleId
        .mockResolvedValueOnce(existingUserByEmail); // Second call: find by email

      mockUserRepository.save.mockResolvedValue({
        ...existingUserByEmail,
        googleId: googleProfile.id,
        displayName: googleProfile.displayName,
        avatarUrl: googleProfile.photos[0].value,
      });

      const result = await service.findOrCreateGoogleUser(googleProfile);

      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result.googleId).toBe(googleProfile.id);
    });

    it('should create new user if not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const newUser = {
        ...mockUser,
        googleId: googleProfile.id,
        email: googleProfile.emails[0].value,
        displayName: googleProfile.displayName,
        avatarUrl: googleProfile.photos[0].value,
      };

      mockUserRepository.create.mockReturnValue(newUser);
      mockUserRepository.save.mockResolvedValue(newUser);

      const result = await service.findOrCreateGoogleUser(googleProfile);

      expect(mockUserRepository.create).toHaveBeenCalledWith({
        googleId: googleProfile.id,
        email: googleProfile.emails[0].value,
        displayName: googleProfile.displayName,
        avatarUrl: googleProfile.photos[0].value,
        role: Role.USER,
        tags: [],
      });
      expect(result).toEqual(newUser);
    });
  });

  describe('authenticateWithGoogle', () => {
    it('should throw UnauthorizedException for invalid Google token', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

      await expect(
        service.authenticateWithGoogle({ idToken: 'invalid-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when payload is null', async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => null,
      });

      await expect(
        service.authenticateWithGoogle({ idToken: 'token-without-payload' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should create new user and return token for valid Google token', async () => {
      const googlePayload = {
        sub: 'google-sub-123',
        email: 'googleuser@example.com',
        name: 'Google Test User',
        picture: 'https://example.com/picture.jpg',
      };

      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => googlePayload,
      });

      mockUserRepository.findOne.mockResolvedValue(null);

      const newUser = {
        id: 'new-google-user-uuid',
        googleId: googlePayload.sub,
        email: googlePayload.email,
        displayName: googlePayload.name,
        avatarUrl: googlePayload.picture,
        role: Role.USER,
        tags: [],
      };

      mockUserRepository.create.mockReturnValue(newUser);
      mockUserRepository.save.mockResolvedValue(newUser);

      const result = await service.authenticateWithGoogle({
        idToken: 'valid-google-token',
      });

      expect(result).toHaveProperty('token', 'mock-jwt-token');
      expect(result.user.email).toBe(googlePayload.email);
    });

    it('should return existing user for valid Google token', async () => {
      const googlePayload = {
        sub: 'google-sub-123',
        email: 'existing@example.com',
        name: 'Existing User',
        picture: 'https://example.com/picture.jpg',
      };

      const existingUser = {
        ...mockUser,
        googleId: googlePayload.sub,
        email: googlePayload.email,
      };

      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => googlePayload,
      });

      mockUserRepository.findOne.mockResolvedValue(existingUser);

      const result = await service.authenticateWithGoogle({
        idToken: 'valid-google-token',
      });

      expect(result).toHaveProperty('token', 'mock-jwt-token');
      expect(result.user.email).toBe(existingUser.email);
    });

    it('should link existing user by email to Google account', async () => {
      const googlePayload = {
        sub: 'google-sub-new',
        email: 'existingbyemail@example.com',
        name: 'Linked User',
        picture: 'https://example.com/newpicture.jpg',
      };

      const existingUserByEmail = {
        ...mockUser,
        googleId: null,
        email: googlePayload.email,
      };

      const updatedUser = {
        ...existingUserByEmail,
        googleId: googlePayload.sub,
        displayName: googlePayload.name,
        avatarUrl: googlePayload.picture,
      };

      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => googlePayload,
      });

      mockUserRepository.findOne
        .mockResolvedValueOnce(null) // Find by googleId
        .mockResolvedValueOnce(existingUserByEmail); // Find by email

      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.authenticateWithGoogle({
        idToken: 'valid-google-token',
      });

      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('token', 'mock-jwt-token');
    });
  });
});
