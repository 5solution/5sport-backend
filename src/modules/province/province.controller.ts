import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/decorators/api-success-response.decorator';

import { ProvinceService } from './province.service';
import {
  ProvinceDto,
  ProvinceDtoResponse,
  WardDto,
} from './dto/province-response.dto';

@ApiTags('Provinces')
@Controller('provinces')
export class ProvinceController {
  constructor(private readonly provinceService: ProvinceService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách tỉnh/thành phố' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Tìm kiếm theo tên',
  })
  @ApiSuccessResponse(ProvinceDto, { isArray: true })
  async listProvinces(@Query('search') search?: string) {
    return this.provinceService.listProvinces(search);
  }

  @Get(':code')
  @ApiOperation({ summary: 'Chi tiết tỉnh/thành phố (kèm phường/xã)' })
  @ApiQuery({
    name: 'depth',
    required: false,
    description: '2: kèm danh sách phường/xã',
    enum: [1, 2],
  })
  @ApiSuccessResponse(ProvinceDto)
  async getProvince(
    @Param('code', ParseIntPipe) code: number,
    @Query('depth') depth?: number,
  ) {
    return this.provinceService.getProvince(
      code,
      depth ? Number(depth) : undefined,
    );
  }

  @Get(':code/wards')
  @ApiOperation({ summary: 'Danh sách phường/xã theo tỉnh/thành phố' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Tìm kiếm theo tên',
  })
  @ApiSuccessResponse(WardDto, { isArray: true })
  async listWardsByProvince(
    @Param('code', ParseIntPipe) code: number,
    @Query('search') search?: string,
  ) {
    return this.provinceService.listWards(code, search);
  }

  @Get('wards/:code')
  @ApiOperation({ summary: 'Chi tiết phường/xã' })
  @ApiSuccessResponse(WardDto)
  async getWard(@Param('code', ParseIntPipe) code: number) {
    return this.provinceService.getWard(code);
  }
}
