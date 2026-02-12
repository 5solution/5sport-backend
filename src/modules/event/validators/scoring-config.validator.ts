import { BadRequestException } from '@nestjs/common';
import { SportType } from '../enums/sport-type.enum';

export interface ScoringConfig {
  sportType: SportType;
  scoringMode: string;
  matchFormat: string;
  pointsToWin: number;
  winByTwo: boolean;
  pointCap?: number | null;
  switchEndsAt?: number;
  changeEnds?: { endOfSet: boolean; interval: boolean };
}

export function validateScoringConfig(config: ScoringConfig): void {
  const errors: string[] = [];

  // Common validations
  if (!config.matchFormat) {
    errors.push('Vui lòng nhập thông tin này.');
  }

  if (
    config.pointsToWin == null ||
    !Number.isInteger(config.pointsToWin) ||
    config.pointsToWin < 1
  ) {
    errors.push('Vui lòng nhập thông tin này.');
  }

  if (config.pointsToWin != null && config.pointsToWin < 11) {
    errors.push('Điểm thắng một set tối thiểu là 11.');
  }

  // Sport-specific validations
  if (config.sportType === SportType.PICKLEBALL) {
    validatePickleball(config, errors);
  } else if (config.sportType === SportType.BADMINTON) {
    validateBadminton(config, errors);
  }

  // Common cross-field validations
  if (
    config.pointCap != null &&
    config.pointsToWin != null &&
    config.pointCap <= config.pointsToWin
  ) {
    errors.push('Điểm trần (Cap) phải lớn hơn điểm thắng set.');
  }

  if (errors.length > 0) {
    throw new BadRequestException(errors);
  }
}

function validatePickleball(config: ScoringConfig, errors: string[]): void {
  if (config.pointsToWin != null && config.pointsToWin > 25) {
    errors.push('Điểm thắng quá lớn. Vui lòng kiểm tra lại.');
  }

  if (config.pointCap != null && !config.winByTwo) {
    errors.push('Điểm trần chỉ được nhập khi bật luật thắng cách biệt 2.');
  }

  if (
    config.switchEndsAt != null &&
    config.pointsToWin != null &&
    config.switchEndsAt >= config.pointsToWin
  ) {
    errors.push('Điểm đổi sân phải nhỏ hơn điểm thắng set.');
  }
}

function validateBadminton(config: ScoringConfig, errors: string[]): void {
  if (config.pointsToWin != null && config.pointsToWin > 31) {
    errors.push('Điểm thắng quá lớn. Vui lòng kiểm tra lại.');
  }
}
