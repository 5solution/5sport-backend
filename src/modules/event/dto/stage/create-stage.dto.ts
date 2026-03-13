import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { StageType } from '../../enums/stage-type.enum';

export class CreateStageDto {
  @ApiProperty({
    description: 'Stage name',
    example: 'Group Stage',
    maxLength: 256,
  })
  @IsString()
  @MaxLength(256)
  name: string;

  @ApiProperty({
    description: 'Stage type',
    enum: StageType,
    example: StageType.SINGLE_ELIMINATION,
  })
  @IsEnum(StageType)
  stageType: StageType;

  @ApiPropertyOptional({
    description:
      'Stage configuration (varies by type). Round Robin: { groupCount, advancePerGroup, playoffType }. Elimination: { seedingType }. Flex: {}',
    example: { seedingType: 'RANDOM' },
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  sortOrder?: number;
}
