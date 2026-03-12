import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsBoolean, IsArray, IsUUID } from 'class-validator';

export class CreateCourtDto {
  @ApiProperty({ description: 'Court name', example: 'San Trung Tam' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Allowed session IDs for category filtering',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  allowedSessionIds?: string[];

  @ApiPropertyOptional({ description: 'Is ghost/holding court', default: false })
  @IsBoolean()
  @IsOptional()
  isGhost?: boolean;
}
