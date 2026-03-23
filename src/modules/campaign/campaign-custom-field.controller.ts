import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiNoContentResponse } from '@nestjs/swagger';
import {
  ApiSuccessResponse,
  ApiCreatedSuccessResponse,
} from 'src/common/decorators/api-success-response.decorator';
import { CampaignCustomFieldService } from './campaign-custom-field.service';
import { CreateCampaignCustomFieldDto } from './dto/create-campaign-custom-field.dto';
import { CustomFieldResponseDto } from './dto/custom-field-response.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('campaign-custom-fields')
@Controller('campaigns/:campaignId/custom-fields')
export class CampaignCustomFieldController {
  constructor(private readonly fieldService: CampaignCustomFieldService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  @ApiCreatedSuccessResponse(CustomFieldResponseDto, {
    description: 'Tạo custom field cho chiến dịch',
  })
  create(@Param('campaignId') campaignId: string, @Body() dto: CreateCampaignCustomFieldDto) {
    return this.fieldService.create(campaignId, dto);
  }

  @Get()
  @ApiSuccessResponse(CustomFieldResponseDto, {
    description: 'Danh sách custom fields của chiến dịch',
    isArray: true,
  })
  findAll(@Param('campaignId') campaignId: string) {
    return this.fieldService.findAll(campaignId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  @ApiSuccessResponse(CustomFieldResponseDto, {
    description: 'Cập nhật custom field',
  })
  update(@Param('campaignId') campaignId: string, @Param('id') id: string, @Body() dto: CreateCampaignCustomFieldDto) {
    return this.fieldService.update(campaignId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  @ApiNoContentResponse({ description: 'Xóa custom field thành công' })
  remove(@Param('campaignId') campaignId: string, @Param('id') id: string) {
    return this.fieldService.remove(campaignId, id);
  }
}
