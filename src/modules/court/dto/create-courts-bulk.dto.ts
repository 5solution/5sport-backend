import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max } from 'class-validator';

export class CreateCourtsBulkDto {
  @ApiProperty({
    description: 'Number of courts to create',
    example: 8,
    minimum: 1,
    maximum: 50,
  })
  @IsInt()
  @Min(1)
  @Max(50)
  count: number;
}
