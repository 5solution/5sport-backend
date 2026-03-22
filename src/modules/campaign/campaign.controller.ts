import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiNoContentResponse, ApiOperation } from '@nestjs/swagger';
import { ApiSuccessResponse, ApiCreatedSuccessResponse } from 'src/common/decorators/api-success-response.decorator';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { UpdateCampaignStatusDto } from './dto/update-campaign-status.dto';
import { CampaignPublicResponseDto } from './dto/campaign-public-response.dto';
import { CampaignResponseDto } from './dto/campaign-response.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { RequestUser } from 'src/common/interfaces/request-user.interface';
import { Role } from 'src/common/enums/role.enum';
import { PaginationQueryDto } from 'src/common/dto/pagination.dto';

@ApiTags('campaigns')
@Controller('campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  @ApiCreatedSuccessResponse(CampaignResponseDto, {
    description: 'Tạo chiến dịch mới',
  })
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateCampaignDto) {
    return this.campaignService.create(user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  @ApiSuccessResponse(CampaignResponseDto, {
    description: 'Danh sách chiến dịch của user',
    isArray: true,
  })
  findAll(@CurrentUser() user: RequestUser) {
    return this.campaignService.findAll(user);
  }

  @Get('public')
  @ApiSuccessResponse(null, {
    description: 'Danh sách chiến dịch công khai (ACTIVE/CLOSED)',
    schema: {
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/CampaignPublicResponseDto' },
        },
        meta: { type: 'object' },
      },
    },
  })
  findPublic(@Query() query: PaginationQueryDto) {
    return this.campaignService.findPublic(query);
  }

  @Get('public/:slug')
  @ApiSuccessResponse(CampaignPublicResponseDto, {
    description: 'Chi tiết chiến dịch công khai',
  })
  findBySlug(@Param('slug') slug: string) {
    return this.campaignService.findBySlug(slug);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  @ApiSuccessResponse(CampaignResponseDto, {
    description: 'Chi tiết chiến dịch',
  })
  findOne(@Param('id') id: string) {
    return this.campaignService.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  @ApiSuccessResponse(CampaignResponseDto, {
    description: 'Cập nhật chiến dịch',
  })
  update(@Param('id') id: string, @CurrentUser() user: RequestUser, @Body() dto: UpdateCampaignDto) {
    return this.campaignService.update(id, user, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiNoContentResponse({ description: 'Xóa chiến dịch thành công' })
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.campaignService.remove(id, user);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  @ApiSuccessResponse(CampaignResponseDto, {
    description: 'Cập nhật trạng thái chiến dịch',
  })
  updateStatus(@Param('id') id: string, @CurrentUser() user: RequestUser, @Body() dto: UpdateCampaignStatusDto) {
    return this.campaignService.updateStatus(id, user, dto);
  }
}
