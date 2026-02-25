import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class RegisterParticipantsDto {
  @ApiProperty({
    description: 'Event ID to register participants for',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  eventId: string;

  @ApiProperty({
    description: 'Session ID to register participants in',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  sessionId: string;

  @ApiProperty({
    description: 'Number of bot participants to register',
    example: 8,
    minimum: 1,
    maximum: 64,
  })
  @IsInt()
  @Min(1)
  @Max(64)
  @Type(() => Number)
  count: number;
}
