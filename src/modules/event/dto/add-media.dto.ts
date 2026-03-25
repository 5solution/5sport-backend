import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString } from 'class-validator';
import { MediaType } from '../enums/media-type.enum';

export class AddMediaDto {
  @ApiProperty({
    description: 'Loại media',
    enum: MediaType,
    example: MediaType.LOGO,
  })
  @IsEnum(MediaType)
  type: MediaType;

  @ApiProperty({
    description: 'URL của media',
    example: 'https://example.com/image.png',
  })
  @IsString()
  url: string;

  @ApiProperty({
    description: 'Kích thước file (bytes)',
    example: 204800,
  })
  @IsNumber()
  fileSize: number;

  @ApiProperty({
    description: 'MIME type của file',
    example: 'image/png',
  })
  @IsString()
  mimeType: string;
}
