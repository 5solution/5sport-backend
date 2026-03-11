import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CampaignDiscountService } from './campaign-discount.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { ValidateDiscountDto } from './dto/validate-discount.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('campaign-discounts')
@Controller('campaigns/:campaignId/discounts')
export class CampaignDiscountController {
  constructor(private readonly discountService: CampaignDiscountService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  create(@Param('campaignId') campaignId: string, @Body() dto: CreateDiscountDto) {
    return this.discountService.create(campaignId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  findAll(@Param('campaignId') campaignId: string) {
    return this.discountService.findAll(campaignId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  update(@Param('campaignId') campaignId: string, @Param('id') id: string, @Body() dto: UpdateDiscountDto) {
    return this.discountService.update(campaignId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  remove(@Param('campaignId') campaignId: string, @Param('id') id: string) {
    return this.discountService.remove(campaignId, id);
  }

  @Post('validate')
  validateDiscount(@Param('campaignId') campaignId: string, @Body() dto: ValidateDiscountDto) {
    return this.discountService.validate(campaignId, dto);
  }
}
