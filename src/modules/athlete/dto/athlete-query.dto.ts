import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from 'src/common/dto';
import { SportType } from 'src/modules/event/enums/sport-type.enum';

export class AthleteQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by sport type',
    enum: SportType,
  })
  @IsEnum(SportType)
  @IsOptional()
  sportType?: SportType;

  @ApiPropertyOptional({
    description: 'Search by name',
    example: 'John',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by city',
    example: 'Ho Chi Minh City',
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by verified status',
    example: true,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Sort by field',
    example: 'currentRating',
    enum: [
      'name',
      'currentRating',
      'totalMatches',
      'winRate',
      'createdAt',
    ],
  })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC';
}
