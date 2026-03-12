import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class MatchQueueQueryDto {
  @ApiPropertyOptional({ description: 'Filter by session ID (category)' })
  @IsUUID()
  @IsOptional()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 50 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 50;
}
