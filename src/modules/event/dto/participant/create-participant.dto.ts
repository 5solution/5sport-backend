import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsObject,
} from 'class-validator';

export class CreateParticipantDto {
  @ApiProperty({
    description: 'Event ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  eventId: string;

  @ApiPropertyOptional({
    description: 'Event session ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsOptional()
  sessionId?: string;

  @ApiProperty({
    description: 'Athlete ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  athleteId: string;

  @ApiPropertyOptional({
    description: 'Partner athlete ID (for doubles)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsOptional()
  partnerId?: string;

  @ApiPropertyOptional({
    description: 'Custom data',
    example: { emergencyContact: '+84901234567' },
  })
  @IsObject()
  @IsOptional()
  customData?: Record<string, any>;
}
