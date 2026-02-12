import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { FieldType } from '../enums/field-type.enum';
import { DB_MAPPING_FIELDS } from '../entities/event-custom-field.entity';

export class CreateCustomFieldDto {
  @ApiProperty({
    description: 'Label hiển thị trên UI',
    example: 'Họ và tên',
    maxLength: 256,
  })
  @IsString()
  @MaxLength(256)
  label: string;

  @ApiProperty({
    description: 'Tên trường (dùng cho báo cáo)',
    example: 'fullName',
    maxLength: 256,
  })
  @IsString()
  @MaxLength(256)
  fieldName: string;

  @ApiPropertyOptional({
    description: 'Mô tả ngắn về câu hỏi',
    example: 'Nhập đầy đủ họ và tên của bạn',
    maxLength: 250,
  })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  description?: string;

  @ApiProperty({
    description: 'Loại câu hỏi',
    enum: FieldType,
    example: FieldType.TEXT,
  })
  @IsEnum(FieldType)
  fieldType: FieldType;

  @ApiPropertyOptional({
    description:
      'Danh sách lựa chọn (bắt buộc cho SINGLE_SELECT và MULTI_SELECT)',
    example: ['Nam', 'Nữ', 'Khác'],
    isArray: true,
  })
  @ValidateIf((o) =>
    [FieldType.SINGLE_SELECT, FieldType.MULTI_SELECT].includes(o.fieldType),
  )
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({
    description: 'Định dạng file cho phép (bắt buộc cho FILE_UPLOAD)',
    example: ['jpg', 'png', 'pdf'],
    isArray: true,
  })
  @ValidateIf((o) => o.fieldType === FieldType.FILE_UPLOAD)
  @IsArray()
  @IsString({ each: true })
  allowedFileTypes?: string[];

  @ApiPropertyOptional({
    description: 'Giá trị mặc định',
    example: 'Việt Nam',
  })
  @IsOptional()
  @IsString()
  defaultValue?: string;

  @ApiPropertyOptional({
    description: 'URL ảnh đính kèm (hiển thị dạng hyperlink)',
    example: 'https://s3.amazonaws.com/bucket/guide.png',
  })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @ApiPropertyOptional({
    description: 'Mapping với trường DB người tham dự (unique trong event)',
    example: 'participantName',
    enum: DB_MAPPING_FIELDS,
  })
  @IsOptional()
  @IsIn([...DB_MAPPING_FIELDS])
  dbMapping?: string;

  @ApiPropertyOptional({
    description: 'Bắt buộc trả lời',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Hiển thị trên UI',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isVisible?: boolean;
}
