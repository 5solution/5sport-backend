import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsOptional, IsObject, Min } from 'class-validator';

export class UpdateScoreDto {
  @ApiProperty({
    description: 'Set number',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  setNumber: number;

  @ApiProperty({
    description: 'Team 1 points',
    example: 21,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  team1Points: number;

  @ApiProperty({
    description: 'Team 2 points',
    example: 19,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  team2Points: number;

  @ApiPropertyOptional({
    description: 'Winner team (1 or 2)',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  winnerTeam?: number;

  @ApiPropertyOptional({
    description: 'Additional details',
    example: {},
  })
  @IsObject()
  @IsOptional()
  details?: Record<string, any>;
}
