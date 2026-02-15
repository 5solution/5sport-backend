import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsNumber,
  IsUUID,
  MaxLength,
  IsObject,
  IsBoolean,
} from 'class-validator';

export class CreateMatchDto {
  @ApiProperty({
    description: 'Event session ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    description: 'Match name',
    example: 'Quarter Final 1',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  name: string;

  @ApiPropertyOptional({
    description: 'Match number',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  matchNumber?: number;

  @ApiPropertyOptional({
    description: 'Round name',
    example: 'Quarter Final',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  round?: string;

  @ApiPropertyOptional({
    description: 'Court number',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  courtNumber?: number;

  @ApiProperty({
    description: 'Scheduled time (ISO format)',
    example: '2024-02-20T09:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  scheduledTime: string;

  @ApiPropertyOptional({ description: 'Team 1 Player 1 ID' })
  @IsUUID()
  @IsOptional()
  team1Player1Id?: string;

  @ApiPropertyOptional({ description: 'Team 1 Player 2 ID' })
  @IsUUID()
  @IsOptional()
  team1Player2Id?: string;

  @ApiPropertyOptional({ description: 'Team 2 Player 1 ID' })
  @IsUUID()
  @IsOptional()
  team2Player1Id?: string;

  @ApiPropertyOptional({ description: 'Team 2 Player 2 ID' })
  @IsUUID()
  @IsOptional()
  team2Player2Id?: string;

  @ApiPropertyOptional({
    description: 'Team 1 name',
    example: 'Team Alpha',
  })
  @IsString()
  @IsOptional()
  @MaxLength(256)
  team1Name?: string;

  @ApiPropertyOptional({
    description: 'Team 2 name',
    example: 'Team Beta',
  })
  @IsString()
  @IsOptional()
  @MaxLength(256)
  team2Name?: string;

  @ApiPropertyOptional({
    description: 'Notes',
    example: 'Special match',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Is bye match',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isBye?: boolean;
}
