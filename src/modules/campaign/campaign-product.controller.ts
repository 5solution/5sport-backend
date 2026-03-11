import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CampaignProductService } from './campaign-product.service';
import { CreateCampaignProductDto } from './dto/create-campaign-product.dto';
import { UpdateCampaignProductDto } from './dto/update-campaign-product.dto';
import { CreatePricingPhaseDto } from './dto/create-pricing-phase.dto';
import { UpdatePricingPhaseDto } from './dto/update-pricing-phase.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('campaign-products')
@Controller('campaigns/:campaignId/products')
export class CampaignProductController {
  constructor(private readonly productService: CampaignProductService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  createProduct(@Param('campaignId') campaignId: string, @CurrentUser() user: any, @Body() dto: CreateCampaignProductDto) {
    return this.productService.createProduct(campaignId, user, dto);
  }

  @Get()
  findProducts(@Param('campaignId') campaignId: string) {
    return this.productService.findProducts(campaignId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  updateProduct(@Param('campaignId') campaignId: string, @Param('id') id: string, @CurrentUser() user: any, @Body() dto: UpdateCampaignProductDto) {
    return this.productService.updateProduct(campaignId, id, user, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  removeProduct(@Param('campaignId') campaignId: string, @Param('id') id: string, @CurrentUser() user: any) {
    return this.productService.removeProduct(campaignId, id, user);
  }

  @Post(':productId/phases')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  createPhase(@Param('campaignId') campaignId: string, @Param('productId') productId: string, @Body() dto: CreatePricingPhaseDto) {
    return this.productService.createPhase(campaignId, productId, dto);
  }

  @Get(':productId/phases')
  findPhases(@Param('campaignId') campaignId: string, @Param('productId') productId: string) {
    return this.productService.findPhases(campaignId, productId);
  }

  @Patch(':productId/phases/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  updatePhase(@Param('campaignId') campaignId: string, @Param('productId') productId: string, @Param('id') id: string, @Body() dto: UpdatePricingPhaseDto) {
    return this.productService.updatePhase(campaignId, productId, id, dto);
  }

  @Delete(':productId/phases/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  removePhase(@Param('campaignId') campaignId: string, @Param('productId') productId: string, @Param('id') id: string) {
    return this.productService.removePhase(campaignId, productId, id);
  }
}
