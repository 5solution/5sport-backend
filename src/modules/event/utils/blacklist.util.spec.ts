import { parseBlacklist } from './blacklist.util';
import { BlacklistType } from '../enums/blacklist-type.enum';

describe('parseBlacklist', () => {
  it('should parse emails and phones from raw string', () => {
    const result = parseBlacklist('test@email.com 0901234567');
    expect(result).toEqual([
      { type: BlacklistType.EMAIL, value: 'test@email.com' },
      { type: BlacklistType.PHONE, value: '0901234567' },
    ]);
  });

  it('should handle newline separators', () => {
    const result = parseBlacklist('a@b.com\n0901234567\nc@d.com');
    expect(result).toHaveLength(3);
    expect(result[0].type).toBe(BlacklistType.EMAIL);
    expect(result[1].type).toBe(BlacklistType.PHONE);
    expect(result[2].type).toBe(BlacklistType.EMAIL);
  });

  it('should lowercase emails', () => {
    const result = parseBlacklist('TEST@EMAIL.COM');
    expect(result[0].value).toBe('test@email.com');
  });

  it('should return empty array for empty string', () => {
    expect(parseBlacklist('')).toEqual([]);
  });

  it('should return empty array for whitespace-only', () => {
    expect(parseBlacklist('   \n  ')).toEqual([]);
  });

  it('should handle mixed separators', () => {
    const result = parseBlacklist('a@b.com  \n\n  0901234567   c@d.com');
    expect(result).toHaveLength(3);
  });
});
