import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiCreatedResponse } from '@nestjs/swagger';
import { CampaignOrderService } from './campaign-order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderResponseDto } from './dto/create-order-response.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('campaign-orders')
@Controller('campaigns/:campaignId/orders')
export class CampaignOrderController {
  constructor(private readonly orderService: CampaignOrderService) {}

  @Post()
  @ApiCreatedResponse({ type: CreateOrderResponseDto })
  create(@Param('campaignId') campaignId: string, @Body() dto: CreateOrderDto) {
    return this.orderService.create(campaignId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  findAll(@Param('campaignId') campaignId: string, @Query() query: OrderQueryDto) {
    return this.orderService.findAll(campaignId, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  findOne(@Param('campaignId') campaignId: string, @Param('id') id: string) {
    return this.orderService.findById(campaignId, id);
  }

}
