import { BlacklistType } from '../enums/blacklist-type.enum';

export interface ParsedBlacklistEntry {
  type: BlacklistType;
  value: string;
}

export function parseBlacklist(raw: string): ParsedBlacklistEntry[] {
  if (!raw || !raw.trim()) return [];

  const tokens = raw.split(/[\s\n]+/).filter(Boolean);
  return tokens.map((token) => ({
    type: token.includes('@') ? BlacklistType.EMAIL : BlacklistType.PHONE,
    value: token.trim().toLowerCase(),
  }));
}
