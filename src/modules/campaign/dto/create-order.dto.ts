import { IsString, IsOptional, IsArray, ValidateNested, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SizeShirt } from '../enums/size-shirt.enum';

export class AthleteInfoDto {
  @ApiProperty({ example: 5, description: 'Cự ly đăng ký (km)' })
  @IsNumber()
  distance: number;

  @ApiProperty({ description: 'Họ và tên đệm' })
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'Tên' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Số điện thoại' })
  @IsString()
  phoneNumber: string;

  @ApiPropertyOptional({ description: 'Địa chỉ' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Quốc tịch' })
  @IsOptional()
  @IsString()
  national?: string;

  @ApiPropertyOptional({ description: 'Mã tỉnh/thành phố (lấy từ API province)' })
  @IsOptional()
  @IsString()
  provinceCode?: string;

  @ApiPropertyOptional({ description: 'Ngày sinh' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'Size áo', enum: SizeShirt })
  @IsOptional()
  @IsEnum(SizeShirt)
  sizeShirt?: SizeShirt;

  @ApiPropertyOptional({ description: 'Câu lạc bộ' })
  @IsOptional()
  @IsString()
  club?: string;

  @ApiPropertyOptional({ description: 'Tên trên BIB' })
  @IsOptional()
  @IsString()
  nameInBib?: string;

  @ApiPropertyOptional({ description: 'SĐT người liên hệ y tế' })
  @IsOptional()
  @IsString()
  medicalInformationPhoneNumber?: string;

  @ApiPropertyOptional({ description: 'Tên người liên hệ y tế' })
  @IsOptional()
  @IsString()
  medicalInformationName?: string;

  @ApiPropertyOptional({ description: 'Thông tin y tế' })
  @IsOptional()
  @IsString()
  medicalInformation?: string;

  @ApiPropertyOptional({ description: 'Loại thuốc đang dùng' })
  @IsOptional()
  @IsString()
  typeOfMedicine?: string;

  @ApiPropertyOptional({ description: 'Nhóm máu' })
  @IsOptional()
  @IsString()
  bloodType?: string;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Họ và tên đệm' })
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'Tên' })
  @IsString()
  firstName: string;

  @ApiPropertyOptional({ description: 'Email' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: 'Số điện thoại' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ type: [AthleteInfoDto], description: 'Danh sách vận động viên' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AthleteInfoDto)
  athletes: AthleteInfoDto[];
}
