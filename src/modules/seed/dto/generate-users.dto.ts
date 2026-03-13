import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GenerateUsersDto {
  @ApiProperty({
    description: 'Number of bot users to generate',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  count: number;

  @ApiPropertyOptional({
    description: 'Prefix for generated names (default: "Bot")',
    example: 'Player',
  })
  @IsOptional()
  @IsString()
  prefix?: string;
}
