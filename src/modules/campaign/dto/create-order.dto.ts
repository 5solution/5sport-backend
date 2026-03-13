import { IsString, IsOptional, IsArray, ValidateNested, IsDateString, IsEmail, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '../enums/gender.enum';

export class GuardianInfoDto {
  @ApiProperty({ description: 'Họ và tên người giám hộ' })
  @IsString()
  fullName: string;

  @ApiProperty({ description: 'Ngày sinh người giám hộ' })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ description: 'Số CCCD / Hộ chiếu người giám hộ' })
  @IsString()
  identityCard: string;

  @ApiProperty({ description: 'Email người giám hộ' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Số điện thoại người giám hộ' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ description: 'Mối quan hệ với người tham gia' })
  @IsString()
  relationship: string;
}

export class AthleteInfoDto {
  @ApiProperty({ example: '5km', description: 'Cự ly đăng ký' })
  @IsString()
  distance: string;

  @ApiProperty({ description: 'Họ và tên đệm' })
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'Tên' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Số điện thoại' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ description: 'Email' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Giới tính', enum: Gender })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ description: 'Ngày sinh' })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ description: 'Số CCCD / Hộ chiếu' })
  @IsString()
  identityCard: string;

  @ApiProperty({ description: 'Quốc tịch' })
  @IsString()
  national: string;

  @ApiProperty({ description: 'Mã tỉnh/thành phố (lấy từ API province)' })
  @IsString()
  provinceCode: string;

  @ApiProperty({ description: 'Địa chỉ' })
  @IsString()
  location: string;

  @ApiProperty({ description: 'Tên trên BIB' })
  @IsString()
  nameInBib: string;

  @ApiPropertyOptional({ description: 'Thông tin người giám hộ (bắt buộc nếu vận động viên dưới 18 tuổi)', type: GuardianInfoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GuardianInfoDto)
  guardian?: GuardianInfoDto;

  @ApiPropertyOptional({ description: 'Size áo (theo danh sách sizeShirtOptions của campaign)' })
  @IsOptional()
  @IsString()
  sizeShirt?: string;

  @ApiPropertyOptional({ description: 'Câu lạc bộ' })
  @IsOptional()
  @IsString()
  club?: string;

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

  @ApiProperty({ description: 'Email' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Số điện thoại' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ type: [AthleteInfoDto], description: 'Danh sách vận động viên' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AthleteInfoDto)
  athletes: AthleteInfoDto[];
}
