import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MaxLength, IsOptional, IsEnum, IsArray, IsUUID } from 'class-validator';
import { CourtStatus } from '../enums/court-status.enum';

export class UpdateCourtDto {
  @ApiPropertyOptional({ description: 'Court name', example: 'San Trung Tam (Live)' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Court status',
    enum: CourtStatus,
  })
  @IsEnum(CourtStatus)
  @IsOptional()
  status?: CourtStatus;

  @ApiPropertyOptional({
    description: 'Allowed session IDs for category filtering',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  allowedSessionIds?: string[];
}
