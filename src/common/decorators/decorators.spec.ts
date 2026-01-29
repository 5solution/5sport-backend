import { describe, it, expect, vi } from 'vitest';

import { Role } from '../enums/role.enum';

import { Roles, ROLES_KEY } from './roles.decorator';

describe('Roles Decorator', () => {
  it('should set metadata with single role', () => {
    const decorator = Roles(Role.ADMIN);

    // Create a mock target and apply the decorator
    const target = {};
    const key = 'testMethod';
    const descriptor = { value: vi.fn() };

    decorator(target, key, descriptor);

    // Verify metadata was set
    const roles = Reflect.getMetadata(ROLES_KEY, descriptor.value);
    expect(roles).toEqual([Role.ADMIN]);
  });

  it('should set metadata with multiple roles', () => {
    const decorator = Roles(Role.ADMIN, Role.ORGANIZER);

    const target = {};
    const key = 'testMethod';
    const descriptor = { value: vi.fn() };

    decorator(target, key, descriptor);

    const roles = Reflect.getMetadata(ROLES_KEY, descriptor.value);
    expect(roles).toEqual([Role.ADMIN, Role.ORGANIZER]);
  });

  it('should set metadata with all roles', () => {
    const decorator = Roles(Role.ADMIN, Role.ORGANIZER, Role.USER);

    const target = {};
    const key = 'testMethod';
    const descriptor = { value: vi.fn() };

    decorator(target, key, descriptor);

    const roles = Reflect.getMetadata(ROLES_KEY, descriptor.value);
    expect(roles).toEqual([Role.ADMIN, Role.ORGANIZER, Role.USER]);
  });

  it('should export ROLES_KEY constant', () => {
    expect(ROLES_KEY).toBe('roles');
  });
});

describe('Role Enum', () => {
  it('should have correct values', () => {
    expect(Role.ADMIN).toBe('admin');
    expect(Role.USER).toBe('user');
    expect(Role.ORGANIZER).toBe('organizer');
  });

  it('should have exactly 3 roles', () => {
    const roleValues = Object.values(Role);
    expect(roleValues.length).toBe(3);
  });
});
