import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsOptional, IsObject, Min } from 'class-validator';

export class UpsertMatchScoreDto {
  @ApiProperty({ description: 'Team 1 points in this set', example: 21 })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  team1Points: number;

  @ApiProperty({ description: 'Team 2 points in this set', example: 19 })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  team2Points: number;

  @ApiPropertyOptional({ description: 'Winner team for this set (1 or 2)', example: 1 })
  @IsNumber()
  @IsOptional()
  winnerTeam?: number;

  @ApiPropertyOptional({
    description: 'Point-by-point details',
    example: { points: [{ team: 1, score: [1, 0] }] },
  })
  @IsObject()
  @IsOptional()
  details?: Record<string, any>;
}
