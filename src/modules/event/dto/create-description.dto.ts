import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDescriptionDto {
  @ApiPropertyOptional({
    description: 'Tiêu đề khối mô tả',
    example: 'Giới thiệu giải đấu',
    maxLength: 256,
  })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  title?: string;

  @ApiProperty({
    description: 'Nội dung mô tả (Rich Text HTML)',
    example: '<p>Giải đấu Pickleball lớn nhất Hà Nội 2026...</p>',
  })
  @IsString()
  content: string;
}
