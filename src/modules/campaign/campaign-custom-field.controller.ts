import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CampaignCustomFieldService } from './campaign-custom-field.service';
import { CreateCampaignCustomFieldDto } from './dto/create-campaign-custom-field.dto';
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
  create(@Param('campaignId') campaignId: string, @Body() dto: CreateCampaignCustomFieldDto) {
    return this.fieldService.create(campaignId, dto);
  }

  @Get()
  findAll(@Param('campaignId') campaignId: string) {
    return this.fieldService.findAll(campaignId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  update(@Param('campaignId') campaignId: string, @Param('id') id: string, @Body() dto: CreateCampaignCustomFieldDto) {
    return this.fieldService.update(campaignId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  remove(@Param('campaignId') campaignId: string, @Param('id') id: string) {
    return this.fieldService.remove(campaignId, id);
  }
}
