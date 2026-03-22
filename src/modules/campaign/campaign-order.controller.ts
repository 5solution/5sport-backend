import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import {
  ApiSuccessResponse,
  ApiCreatedSuccessResponse,
} from 'src/common/decorators/api-success-response.decorator';
import { Response } from 'express';
import { CampaignOrderService } from './campaign-order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderResponseDto } from './dto/create-order-response.dto';
import { OrderResponseDto } from './dto/order-response.dto';
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
  @ApiCreatedSuccessResponse(CreateOrderResponseDto, {
    description: 'Tạo đơn hàng mới',
  })
  create(@Param('campaignId') campaignId: string, @Body() dto: CreateOrderDto) {
    return this.orderService.create(campaignId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  @ApiSuccessResponse(null, {
    description: 'Danh sách đơn hàng (phân trang)',
    schema: {
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/OrderResponseDto' },
        },
        meta: { type: 'object' },
      },
    },
  })
  findAll(
    @Param('campaignId') campaignId: string,
    @Query() query: OrderQueryDto,
  ) {
    return this.orderService.findAll(campaignId, query);
  }

  @Post(':orderCode/resend-email')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  @ApiSuccessResponse(null, {
    description: 'Gửi lại email xác nhận đơn hàng',
  })
  resendEmail(
    @Param('campaignId') campaignId: string,
    @Param('orderCode') orderCode: string,
  ) {
    return this.orderService.resendOrderConfirmationEmail(
      campaignId,
      orderCode,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  @ApiSuccessResponse(OrderResponseDto, {
    description: 'Chi tiết đơn hàng',
  })
  findOne(@Param('campaignId') campaignId: string, @Param('id') id: string) {
    return this.orderService.findById(campaignId, id);
  }

  @Get('export/excel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  async exportExcel(
    @Param('campaignId') campaignId: string,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
    @Res() res: Response,
  ) {
    const buffer = await this.orderService.exportExcel(
      campaignId,
      fromDate,
      toDate,
    );
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=orders-${campaignId}.xlsx`,
    });
    res.end(buffer);
  }
}
