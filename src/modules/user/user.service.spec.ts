import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { Role } from '../../common/enums/role.enum';

import { User } from './user.entity';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let _userRepository: Repository<User>;

  const mockUsers: Partial<User>[] = [
    {
      id: 'user-uuid-1',
      email: 'user1@example.com',
      displayName: 'User One',
      role: Role.ADMIN,
      tags: ['admin', 'staff'],
      avatarUrl: 'https://example.com/avatar1.jpg',
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01'),
    },
    {
      id: 'user-uuid-2',
      email: 'user2@example.com',
      displayName: 'User Two',
      role: Role.USER,
      tags: ['sports'],
      avatarUrl: null,
      created_at: new Date('2024-01-02'),
      updated_at: new Date('2024-01-02'),
    },
    {
      id: 'user-uuid-3',
      email: 'user3@example.com',
      displayName: 'User Three',
      role: Role.ORGANIZER,
      tags: ['organizer', 'premium'],
      avatarUrl: 'https://example.com/avatar3.jpg',
      created_at: new Date('2024-01-03'),
      updated_at: new Date('2024-01-03'),
    },
  ];

  const mockUserRepository = {
    findOne: vi.fn(),
    findAndCount: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    _userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('findAllPaginated', () => {
    it('should return paginated users with default pagination', async () => {
      mockUserRepository.findAndCount.mockResolvedValue([mockUsers, 3]);

      const result = await service.findAllPaginated({});

      expect(mockUserRepository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        order: { created_at: 'DESC' },
        select: [
          'id',
          'email',
          'displayName',
          'avatarUrl',
          'role',
          'tags',
          'created_at',
          'updated_at',
        ],
      });
      expect(result.data).toEqual(mockUsers);
      expect(result.meta.totalItems).toBe(3);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.hasPreviousPage).toBe(false);
    });

    it('should return paginated users with custom page and limit', async () => {
      mockUserRepository.findAndCount.mockResolvedValue([[mockUsers[1]], 3]);

      const result = await service.findAllPaginated({ page: 2, limit: 1 });

      expect(mockUserRepository.findAndCount).toHaveBeenCalledWith({
        skip: 1,
        take: 1,
        order: { created_at: 'DESC' },
        select: [
          'id',
          'email',
          'displayName',
          'avatarUrl',
          'role',
          'tags',
          'created_at',
          'updated_at',
        ],
      });
      expect(result.data).toHaveLength(1);
      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(1);
      expect(result.meta.totalItems).toBe(3);
      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.hasPreviousPage).toBe(true);
    });

    it('should return empty array when no users found', async () => {
      mockUserRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAllPaginated({ page: 1, limit: 10 });

      expect(result.data).toEqual([]);
      expect(result.meta.totalItems).toBe(0);
      expect(result.meta.totalPages).toBe(0);
      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.hasPreviousPage).toBe(false);
    });

    it('should handle last page correctly', async () => {
      mockUserRepository.findAndCount.mockResolvedValue([[mockUsers[2]], 3]);

      const result = await service.findAllPaginated({ page: 3, limit: 1 });

      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.hasPreviousPage).toBe(true);
    });

    it('should handle first page correctly', async () => {
      mockUserRepository.findAndCount.mockResolvedValue([mockUsers, 10]);

      const result = await service.findAllPaginated({ page: 1, limit: 3 });

      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.hasPreviousPage).toBe(false);
    });

    it('should use default values when page and limit are undefined', async () => {
      mockUserRepository.findAndCount.mockResolvedValue([mockUsers, 3]);

      const result = await service.findAllPaginated({
        page: undefined,
        limit: undefined,
      });

      expect(mockUserRepository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        order: { created_at: 'DESC' },
        select: expect.any(Array),
      });
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      const expectedUser = mockUsers[0];
      mockUserRepository.findOne.mockResolvedValue(expectedUser);

      const result = await service.findById('user-uuid-1');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-uuid-1' },
        select: [
          'id',
          'email',
          'displayName',
          'avatarUrl',
          'role',
          'tags',
          'created_at',
          'updated_at',
        ],
      });
      expect(result).toEqual(expectedUser);
    });

    it('should return null when user is not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.findById('non-existent-uuid');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'non-existent-uuid' },
        select: expect.any(Array),
      });
      expect(result).toBeNull();
    });

    it('should exclude password from returned user', async () => {
      const _userWithPassword = {
        ...mockUsers[0],
        password: 'hashedPassword123',
      };
      mockUserRepository.findOne.mockResolvedValue(mockUsers[0]);

      const _result = await service.findById('user-uuid-1');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-uuid-1' },
        select: expect.not.arrayContaining(['password']),
      });
    });
  });
});
