import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { Role } from '../enums/role.enum';

import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockReflector = {
    getAllAndOverride: vi.fn(),
  };

  const createMockExecutionContext = (user?: any): ExecutionContext => {
    return {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  describe('canActivate', () => {
    it('should return true when no roles are required', () => {
      mockReflector.getAllAndOverride.mockReturnValue(null);

      const context = createMockExecutionContext({ role: Role.USER });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when roles array is empty', () => {
      mockReflector.getAllAndOverride.mockReturnValue([]);

      const context = createMockExecutionContext({ role: Role.USER });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user is not authenticated', () => {
      mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

      const context = createMockExecutionContext(undefined);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('User not authenticated');
    });

    it('should throw ForbiddenException when user does not have required role', () => {
      mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

      const context = createMockExecutionContext({ role: Role.USER });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'Access denied. Required roles: admin',
      );
    });

    it('should return true when user has the required role', () => {
      mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

      const context = createMockExecutionContext({ role: Role.ADMIN });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when user has one of multiple required roles', () => {
      mockReflector.getAllAndOverride.mockReturnValue([
        Role.ADMIN,
        Role.ORGANIZER,
      ]);

      const context = createMockExecutionContext({ role: Role.ORGANIZER });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException with all required roles in message', () => {
      mockReflector.getAllAndOverride.mockReturnValue([
        Role.ADMIN,
        Role.ORGANIZER,
      ]);

      const context = createMockExecutionContext({ role: Role.USER });

      expect(() => guard.canActivate(context)).toThrow(
        'Access denied. Required roles: admin, organizer',
      );
    });

    it('should allow admin to access organizer endpoints', () => {
      mockReflector.getAllAndOverride.mockReturnValue([
        Role.ORGANIZER,
        Role.ADMIN,
      ]);

      const context = createMockExecutionContext({ role: Role.ADMIN });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should handle user role for user-only endpoints', () => {
      mockReflector.getAllAndOverride.mockReturnValue([Role.USER]);

      const context = createMockExecutionContext({ role: Role.USER });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should get roles from both handler and class', () => {
      mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

      const mockHandler = vi.fn();
      const mockClass = vi.fn();
      const context = {
        getHandler: vi.fn().mockReturnValue(mockHandler),
        getClass: vi.fn().mockReturnValue(mockClass),
        switchToHttp: vi.fn().mockReturnValue({
          getRequest: vi.fn().mockReturnValue({ user: { role: Role.ADMIN } }),
        }),
      } as unknown as ExecutionContext;

      guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('roles', [
        mockHandler,
        mockClass,
      ]);
    });
  });
});
