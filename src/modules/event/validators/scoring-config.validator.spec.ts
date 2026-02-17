import { BadRequestException } from '@nestjs/common';
import {
  validateScoringConfig,
  ScoringConfig,
} from './scoring-config.validator';
import { SportType } from '../enums/sport-type.enum';

describe('validateScoringConfig', () => {
  describe('Common validations', () => {
    it('should pass with valid pickleball config', () => {
      const config: ScoringConfig = {
        sportType: SportType.PICKLEBALL,
        scoringMode: 'SIDE_OUT',
        matchFormat: '1_SET',
        pointsToWin: 11,
        winByTwo: true,
        pointCap: 15,
        switchEndsAt: 6,
      };
      expect(() => validateScoringConfig(config)).not.toThrow();
    });

    it('should pass with valid badminton config', () => {
      const config: ScoringConfig = {
        sportType: SportType.BADMINTON,
        scoringMode: 'RALLY_POINT',
        matchFormat: 'BEST_OF_3',
        pointsToWin: 21,
        winByTwo: true,
        pointCap: 30,
        changeEnds: { endOfSet: true, interval: true },
      };
      expect(() => validateScoringConfig(config)).not.toThrow();
    });

    it('should throw ERR_REQUIRED if matchFormat is empty', () => {
      const config: ScoringConfig = {
        sportType: SportType.PICKLEBALL,
        scoringMode: 'SIDE_OUT',
        matchFormat: '',
        pointsToWin: 11,
        winByTwo: true,
      };
      expect(() => validateScoringConfig(config)).toThrow(BadRequestException);
    });

    it('should throw ERR_POINTS_MIN if points < 11', () => {
      const config: ScoringConfig = {
        sportType: SportType.PICKLEBALL,
        scoringMode: 'SIDE_OUT',
        matchFormat: '1_SET',
        pointsToWin: 5,
        winByTwo: true,
      };
      try {
        validateScoringConfig(config);
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        const response = (e as BadRequestException).getResponse();
        expect((response as any).message).toContain(
          'Điểm thắng một set tối thiểu là 11.',
        );
      }
    });

    it('should throw ERR_CAP_INVALID if cap <= points', () => {
      const config: ScoringConfig = {
        sportType: SportType.PICKLEBALL,
        scoringMode: 'SIDE_OUT',
        matchFormat: '1_SET',
        pointsToWin: 11,
        winByTwo: true,
        pointCap: 11,
      };
      try {
        validateScoringConfig(config);
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        const response = (e as BadRequestException).getResponse();
        expect((response as any).message).toContain(
          'Điểm trần (Cap) phải lớn hơn điểm thắng set.',
        );
      }
    });

    it('should throw if cap < points', () => {
      const config: ScoringConfig = {
        sportType: SportType.PICKLEBALL,
        scoringMode: 'SIDE_OUT',
        matchFormat: '1_SET',
        pointsToWin: 21,
        winByTwo: true,
        pointCap: 20,
      };
      expect(() => validateScoringConfig(config)).toThrow(BadRequestException);
    });
  });

  describe('Pickleball-specific', () => {
    it('should throw ERR_POINTS_MAX if points > 25', () => {
      const config: ScoringConfig = {
        sportType: SportType.PICKLEBALL,
        scoringMode: 'SIDE_OUT',
        matchFormat: '1_SET',
        pointsToWin: 30,
        winByTwo: true,
      };
      try {
        validateScoringConfig(config);
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        const response = (e as BadRequestException).getResponse();
        expect((response as any).message).toContain(
          'Điểm thắng quá lớn. Vui lòng kiểm tra lại.',
        );
      }
    });

    it('should throw if pointCap is set but winByTwo is false', () => {
      const config: ScoringConfig = {
        sportType: SportType.PICKLEBALL,
        scoringMode: 'SIDE_OUT',
        matchFormat: '1_SET',
        pointsToWin: 11,
        winByTwo: false,
        pointCap: 15,
      };
      expect(() => validateScoringConfig(config)).toThrow(BadRequestException);
    });

    it('should throw ERR_SWITCH_INVALID if switchEndsAt >= points', () => {
      const config: ScoringConfig = {
        sportType: SportType.PICKLEBALL,
        scoringMode: 'SIDE_OUT',
        matchFormat: '1_SET',
        pointsToWin: 11,
        winByTwo: true,
        switchEndsAt: 15,
      };
      try {
        validateScoringConfig(config);
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        const response = (e as BadRequestException).getResponse();
        expect((response as any).message).toContain(
          'Điểm đổi sân phải nhỏ hơn điểm thắng set.',
        );
      }
    });

    it('should throw if switchEndsAt equals pointsToWin', () => {
      const config: ScoringConfig = {
        sportType: SportType.PICKLEBALL,
        scoringMode: 'SIDE_OUT',
        matchFormat: '1_SET',
        pointsToWin: 11,
        winByTwo: true,
        switchEndsAt: 11,
      };
      expect(() => validateScoringConfig(config)).toThrow(BadRequestException);
    });

    it('should pass with switchEndsAt = 0 (disabled)', () => {
      const config: ScoringConfig = {
        sportType: SportType.PICKLEBALL,
        scoringMode: 'SIDE_OUT',
        matchFormat: '1_SET',
        pointsToWin: 11,
        winByTwo: false,
        switchEndsAt: 0,
      };
      expect(() => validateScoringConfig(config)).not.toThrow();
    });

    it('should pass with no pointCap when winByTwo is true', () => {
      const config: ScoringConfig = {
        sportType: SportType.PICKLEBALL,
        scoringMode: 'RALLY_POINT',
        matchFormat: 'BEST_OF_3',
        pointsToWin: 11,
        winByTwo: true,
      };
      expect(() => validateScoringConfig(config)).not.toThrow();
    });
  });

  describe('Badminton-specific', () => {
    it('should throw ERR_POINTS_MAX if points > 31', () => {
      const config: ScoringConfig = {
        sportType: SportType.BADMINTON,
        scoringMode: 'RALLY_POINT',
        matchFormat: 'BEST_OF_3',
        pointsToWin: 35,
        winByTwo: true,
        pointCap: 40,
      };
      try {
        validateScoringConfig(config);
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        const response = (e as BadRequestException).getResponse();
        expect((response as any).message).toContain(
          'Điểm thắng quá lớn. Vui lòng kiểm tra lại.',
        );
      }
    });

    it('should pass with valid 21 points and 30 cap', () => {
      const config: ScoringConfig = {
        sportType: SportType.BADMINTON,
        scoringMode: 'RALLY_POINT',
        matchFormat: 'BEST_OF_3',
        pointsToWin: 21,
        winByTwo: true,
        pointCap: 30,
      };
      expect(() => validateScoringConfig(config)).not.toThrow();
    });

    it('should pass with 31 points for single set format', () => {
      const config: ScoringConfig = {
        sportType: SportType.BADMINTON,
        scoringMode: 'RALLY_POINT',
        matchFormat: 'BEST_OF_3',
        pointsToWin: 31,
        winByTwo: true,
        pointCap: 40,
      };
      expect(() => validateScoringConfig(config)).not.toThrow();
    });
  });
});
