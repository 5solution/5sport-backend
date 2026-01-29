import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { Role } from '../../common/enums/role.enum';

import { UsersController } from './user.controller';
import { User } from './user.entity';
import { UserService } from './user.service';

describe('UsersController', () => {
  let controller: UsersController;
  let userService: UserService;

  const mockUsers: Partial<User>[] = [
    {
      id: 'user-uuid-1',
      email: 'user1@example.com',
      displayName: 'User One',
      role: Role.ADMIN,
      tags: ['admin'],
      avatarUrl: 'https://example.com/avatar1.jpg',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 'user-uuid-2',
      email: 'user2@example.com',
      displayName: 'User Two',
      role: Role.USER,
      tags: ['sports'],
      avatarUrl: null,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  const mockPaginatedResponse = {
    data: mockUsers,
    meta: {
      page: 1,
      limit: 10,
      totalItems: 2,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };

  const mockUserService = {
    findAllPaginated: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    userService = module.get<UserService>(UserService);
  });

  describe('getUsers', () => {
    it('should return paginated users with default pagination', async () => {
      const query: PaginationQueryDto = {};

      mockUserService.findAllPaginated.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.getUsers(query);

      expect(userService.findAllPaginated).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should return paginated users with custom page and limit', async () => {
      const query: PaginationQueryDto = { page: 2, limit: 5 };

      const customResponse = {
        ...mockPaginatedResponse,
        meta: {
          ...mockPaginatedResponse.meta,
          page: 2,
          limit: 5,
        },
      };

      mockUserService.findAllPaginated.mockResolvedValue(customResponse);

      const result = await controller.getUsers(query);

      expect(userService.findAllPaginated).toHaveBeenCalledWith(query);
      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(5);
    });

    it('should return empty array when no users exist', async () => {
      const query: PaginationQueryDto = {};

      const emptyResponse = {
        data: [],
        meta: {
          page: 1,
          limit: 10,
          totalItems: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      mockUserService.findAllPaginated.mockResolvedValue(emptyResponse);

      const result = await controller.getUsers(query);

      expect(result.data).toEqual([]);
      expect(result.meta.totalItems).toBe(0);
    });
  });

  describe('getCurrentUser', () => {
    it('should return the current user from JWT', async () => {
      const currentUser: Partial<User> = {
        id: 'current-user-uuid',
        email: 'current@example.com',
        displayName: 'Current User',
        role: Role.USER,
        tags: ['fitness'],
      };

      const result = await controller.getCurrentUser(currentUser as User);

      expect(result).toEqual(currentUser);
    });

    it('should return admin user when admin is authenticated', async () => {
      const adminUser: Partial<User> = {
        id: 'admin-uuid',
        email: 'admin@example.com',
        displayName: 'Admin User',
        role: Role.ADMIN,
        tags: ['admin', 'staff'],
      };

      const result = await controller.getCurrentUser(adminUser as User);

      expect(result).toEqual(adminUser);
      expect(result.role).toBe(Role.ADMIN);
    });

    it('should return organizer user when organizer is authenticated', async () => {
      const organizerUser: Partial<User> = {
        id: 'organizer-uuid',
        email: 'organizer@example.com',
        displayName: 'Organizer User',
        role: Role.ORGANIZER,
        tags: ['organizer'],
      };

      const result = await controller.getCurrentUser(organizerUser as User);

      expect(result).toEqual(organizerUser);
      expect(result.role).toBe(Role.ORGANIZER);
    });
  });
});
