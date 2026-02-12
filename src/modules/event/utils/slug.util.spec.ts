import { generateSlug, removeVietnameseTones } from './slug.util';

describe('slug utils', () => {
  describe('removeVietnameseTones', () => {
    it('should remove Vietnamese tones', () => {
      expect(removeVietnameseTones('Giải Pickleball Hà Nội')).toBe(
        'Giai Pickleball Ha Noi',
      );
    });

    it('should handle đ -> d', () => {
      expect(removeVietnameseTones('Đà Nẵng')).toBe('Da Nang');
    });

    it('should handle mixed case', () => {
      expect(removeVietnameseTones('Điểm Đổi Sân')).toBe('Diem Doi San');
    });

    it('should keep non-Vietnamese chars as-is', () => {
      expect(removeVietnameseTones('Hello World 123')).toBe(
        'Hello World 123',
      );
    });
  });

  describe('generateSlug', () => {
    it('should generate slug from Vietnamese name', () => {
      expect(generateSlug('Giải Pickleball Hà Nội 2026')).toBe(
        'giai-pickleball-ha-noi-2026',
      );
    });

    it('should handle special characters', () => {
      expect(generateSlug('Sự kiện #1 - Cầu lông!')).toBe(
        'su-kien-1-cau-long',
      );
    });

    it('should trim leading/trailing hyphens', () => {
      expect(generateSlug('  ---Test Event---  ')).toBe('test-event');
    });

    it('should collapse multiple hyphens', () => {
      expect(generateSlug('A   B   C')).toBe('a-b-c');
    });

    it('should handle empty string', () => {
      expect(generateSlug('')).toBe('');
    });
  });
});
