import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { describe, it, expect } from 'vitest';

import {
  PaginationQueryDto,
  PaginationMetaDto,
  PaginatedResponseDto,
} from './pagination.dto';

describe('PaginationQueryDto', () => {
  describe('validation', () => {
    it('should pass validation with default values', async () => {
      const dto = new PaginationQueryDto();
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass validation with valid page and limit', async () => {
      const dto = plainToClass(PaginationQueryDto, { page: 2, limit: 20 });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation with page less than 1', async () => {
      const dto = plainToClass(PaginationQueryDto, { page: 0, limit: 10 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('page');
    });

    it('should fail validation with negative page', async () => {
      const dto = plainToClass(PaginationQueryDto, { page: -1, limit: 10 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation with limit less than 1', async () => {
      const dto = plainToClass(PaginationQueryDto, { page: 1, limit: 0 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('limit');
    });

    it('should fail validation with limit greater than 100', async () => {
      const dto = plainToClass(PaginationQueryDto, { page: 1, limit: 101 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('limit');
    });

    it('should pass validation with limit at maximum boundary (100)', async () => {
      const dto = plainToClass(PaginationQueryDto, { page: 1, limit: 100 });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should transform string numbers to integers', async () => {
      const dto = plainToClass(PaginationQueryDto, {
        page: '5',
        limit: '25',
      });
      expect(dto.page).toBe(5);
      expect(dto.limit).toBe(25);
    });

    it('should have default values', () => {
      const dto = new PaginationQueryDto();
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(10);
    });
  });
});

describe('PaginationMetaDto', () => {
  it('should have all required properties', () => {
    const meta: PaginationMetaDto = {
      page: 1,
      limit: 10,
      totalItems: 100,
      totalPages: 10,
      hasNextPage: true,
      hasPreviousPage: false,
    };

    expect(meta.page).toBe(1);
    expect(meta.limit).toBe(10);
    expect(meta.totalItems).toBe(100);
    expect(meta.totalPages).toBe(10);
    expect(meta.hasNextPage).toBe(true);
    expect(meta.hasPreviousPage).toBe(false);
  });
});

describe('PaginatedResponseDto', () => {
  interface TestItem {
    id: string;
    name: string;
  }

  it('should calculate metadata correctly for first page', () => {
    const data: TestItem[] = [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' },
    ];

    const response = new PaginatedResponseDto<TestItem>(data, 10, 1, 2);

    expect(response.data).toEqual(data);
    expect(response.meta.page).toBe(1);
    expect(response.meta.limit).toBe(2);
    expect(response.meta.totalItems).toBe(10);
    expect(response.meta.totalPages).toBe(5);
    expect(response.meta.hasNextPage).toBe(true);
    expect(response.meta.hasPreviousPage).toBe(false);
  });

  it('should calculate metadata correctly for middle page', () => {
    const data: TestItem[] = [{ id: '3', name: 'Item 3' }];

    const response = new PaginatedResponseDto<TestItem>(data, 10, 3, 2);

    expect(response.meta.page).toBe(3);
    expect(response.meta.totalPages).toBe(5);
    expect(response.meta.hasNextPage).toBe(true);
    expect(response.meta.hasPreviousPage).toBe(true);
  });

  it('should calculate metadata correctly for last page', () => {
    const data: TestItem[] = [{ id: '10', name: 'Item 10' }];

    const response = new PaginatedResponseDto<TestItem>(data, 10, 5, 2);

    expect(response.meta.page).toBe(5);
    expect(response.meta.totalPages).toBe(5);
    expect(response.meta.hasNextPage).toBe(false);
    expect(response.meta.hasPreviousPage).toBe(true);
  });

  it('should handle empty data', () => {
    const response = new PaginatedResponseDto<TestItem>([], 0, 1, 10);

    expect(response.data).toEqual([]);
    expect(response.meta.totalItems).toBe(0);
    expect(response.meta.totalPages).toBe(0);
    expect(response.meta.hasNextPage).toBe(false);
    expect(response.meta.hasPreviousPage).toBe(false);
  });

  it('should handle single item', () => {
    const data: TestItem[] = [{ id: '1', name: 'Only Item' }];

    const response = new PaginatedResponseDto<TestItem>(data, 1, 1, 10);

    expect(response.meta.totalItems).toBe(1);
    expect(response.meta.totalPages).toBe(1);
    expect(response.meta.hasNextPage).toBe(false);
    expect(response.meta.hasPreviousPage).toBe(false);
  });

  it('should handle exactly one page of items', () => {
    const data: TestItem[] = [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' },
    ];

    const response = new PaginatedResponseDto<TestItem>(data, 2, 1, 10);

    expect(response.meta.totalPages).toBe(1);
    expect(response.meta.hasNextPage).toBe(false);
    expect(response.meta.hasPreviousPage).toBe(false);
  });

  it('should calculate correct total pages with remainder', () => {
    const data: TestItem[] = [{ id: '1', name: 'Item 1' }];

    const response = new PaginatedResponseDto<TestItem>(data, 11, 1, 5);

    expect(response.meta.totalPages).toBe(3); // ceil(11/5) = 3
  });
});
