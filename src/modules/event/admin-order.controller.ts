import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/decorators/api-success-response.decorator';
import { EventOrderService } from './event-order.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('admin-orders')
@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.ORGANIZER)
@ApiBearerAuth()
export class AdminOrderController {
  constructor(private readonly orderService: EventOrderService) {}

  @Get()
  @ApiSuccessResponse(null, { description: 'Danh sách tất cả đơn hàng' })
  findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('status') status: string,
    @Query('eventId') eventId: string,
    @Query('search') search: string,
  ) {
    return this.orderService.findAllOrders({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      status: status || undefined,
      eventId: eventId || undefined,
      search: search || undefined,
    });
  }

  @Get(':orderCode')
  @ApiSuccessResponse(null, { description: 'Chi tiết đơn hàng' })
  findOne(@Param('orderCode') orderCode: string) {
    return this.orderService.findByOrderCode(orderCode);
  }
}
