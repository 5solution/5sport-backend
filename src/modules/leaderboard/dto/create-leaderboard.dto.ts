import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { SportType } from 'src/modules/event/enums/sport-type.enum';
import { LeaderboardType } from '../enums/leaderboard-type.enum';

export class CreateLeaderboardDto {
  @ApiProperty({
    description: 'Leaderboard name',
    example: 'January 2024 Pickleball Rankings',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  name: string;

  @ApiProperty({
    description: 'Leaderboard type',
    enum: LeaderboardType,
    example: LeaderboardType.MONTHLY,
  })
  @IsEnum(LeaderboardType)
  @IsNotEmpty()
  type: LeaderboardType;

  @ApiProperty({
    description: 'Sport type',
    enum: SportType,
    example: SportType.PICKLEBALL,
  })
  @IsEnum(SportType)
  @IsNotEmpty()
  sportType: SportType;

  @ApiPropertyOptional({
    description: 'Period (for monthly/yearly leaderboards)',
    example: '2024-01-01',
  })
  @IsDateString()
  @IsOptional()
  period?: string;

  @ApiPropertyOptional({
    description: 'Event ID (for event-specific leaderboards)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsOptional()
  eventId?: string;

  @ApiProperty({
    description: 'Start date',
    example: '2024-01-01',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiPropertyOptional({
    description: 'End date',
    example: '2024-01-31',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Description',
    example: 'Monthly rankings for January 2024',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
