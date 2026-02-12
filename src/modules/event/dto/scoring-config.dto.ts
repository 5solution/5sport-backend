import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { SportType } from '../enums/sport-type.enum';

export class BadmintonChangeEndsDto {
  @ApiProperty({
    description: 'Đổi sân sau mỗi set',
    example: true,
  })
  @IsBoolean()
  endOfSet: boolean;

  @ApiProperty({
    description: 'Đổi sân/Nghỉ khi chạm 11 điểm ở set 3',
    example: true,
  })
  @IsBoolean()
  interval: boolean;
}

export class ScoringConfigDto {
  @ApiProperty({
    description: 'Loại hình thể thao',
    enum: SportType,
    example: SportType.PICKLEBALL,
  })
  @IsEnum(SportType)
  sportType: SportType;

  @ApiProperty({
    description: 'Cơ chế tính điểm',
    enum: ['SIDE_OUT', 'RALLY_POINT'],
    example: 'SIDE_OUT',
  })
  @IsIn(['SIDE_OUT', 'RALLY_POINT'])
  scoringMode: 'SIDE_OUT' | 'RALLY_POINT';

  @ApiProperty({
    description: 'Thể thức trận đấu',
    enum: ['1_SET', 'BEST_OF_3', 'BEST_OF_5'],
    example: '1_SET',
  })
  @IsIn(['1_SET', 'BEST_OF_3', 'BEST_OF_5'])
  matchFormat: '1_SET' | 'BEST_OF_3' | 'BEST_OF_5';

  @ApiProperty({
    description: 'Điểm số để thắng 1 set (min: 11, max depends on sportType)',
    example: 11,
    minimum: 11,
  })
  @IsInt()
  @Min(11)
  pointsToWin: number;

  @ApiProperty({
    description: 'Yêu cầu thắng cách biệt 2 điểm',
    example: true,
  })
  @IsBoolean()
  winByTwo: boolean;

  @ApiPropertyOptional({
    description: 'Điểm trần (cap) - điểm tối đa để kết thúc ván',
    example: 15,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  pointCap?: number;

  @ApiPropertyOptional({
    description: 'Điểm đổi sân (Pickleball only, 0 = disabled)',
    example: 6,
  })
  @ValidateIf((o) => o.sportType === SportType.PICKLEBALL)
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  switchEndsAt?: number;

  @ApiPropertyOptional({
    description: 'Cấu hình đổi sân (Badminton only)',
    type: BadmintonChangeEndsDto,
  })
  @ValidateIf((o) => o.sportType === SportType.BADMINTON)
  @IsOptional()
  @ValidateNested()
  @Type(() => Number)
  changeEnds?: BadmintonChangeEndsDto;
}
