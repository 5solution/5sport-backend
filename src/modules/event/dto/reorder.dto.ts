import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class ReorderDto {
  @ApiProperty({
    description: 'Danh sách ID theo thứ tự mới',
    example: [
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002',
      '550e8400-e29b-41d4-a716-446655440003',
    ],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
