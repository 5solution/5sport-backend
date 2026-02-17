import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WardDto {
  @ApiProperty({ description: 'Tên phường/xã', example: 'Phường Bà Rịa' })
  name: string;

  @ApiProperty({ description: 'Mã phường/xã', example: 26560 })
  code: number;

  @ApiProperty({ description: 'Loại đơn vị hành chính', example: 'phường' })
  division_type: string;

  @ApiProperty({ description: 'Tên mã', example: 'phuong_ba_ria' })
  codename: string;

  @ApiProperty({ description: 'Mã tỉnh/thành phố', example: 79 })
  province_code: number;
}

export class ProvinceDtoResponse {
  @ApiProperty({
    description: 'Danh sách tỉnh/thành phố',
    type: Array<ProvinceDto>,
  })
  data: ProvinceDto[];
}

export class ProvinceDto {
  @ApiProperty({
    description: 'Tên tỉnh/thành phố',
    example: 'Thành phố Hà Nội',
  })
  name: string;

  @ApiProperty({ description: 'Mã tỉnh/thành phố', example: 1 })
  code: number;

  @ApiProperty({
    description: 'Loại đơn vị hành chính',
    example: 'thành phố trung ương',
  })
  division_type: string;

  @ApiProperty({ description: 'Tên mã', example: 'ha_noi' })
  codename: string;

  @ApiProperty({ description: 'Mã điện thoại vùng', example: 24 })
  phone_code: number;

  @ApiPropertyOptional({
    description: 'Danh sách phường/xã (chỉ khi depth=2)',
    type: [WardDto],
  })
  wards?: WardDto[];
}
