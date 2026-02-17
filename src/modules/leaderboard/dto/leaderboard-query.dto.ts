import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from 'src/common/dto';
import { SportType } from 'src/modules/event/enums/sport-type.enum';
import { LeaderboardType } from '../enums/leaderboard-type.enum';

export class LeaderboardQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by sport type',
    enum: SportType,
  })
  @IsEnum(SportType)
  @IsOptional()
  sportType?: SportType;

  @ApiPropertyOptional({
    description: 'Filter by leaderboard type',
    enum: LeaderboardType,
  })
  @IsEnum(LeaderboardType)
  @IsOptional()
  type?: LeaderboardType;

  @ApiPropertyOptional({
    description: 'Filter by event ID',
  })
  @IsUUID()
  @IsOptional()
  eventId?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
