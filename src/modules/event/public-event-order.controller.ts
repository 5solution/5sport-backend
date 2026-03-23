import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/decorators/api-success-response.decorator';
import { EventOrderService } from './event-order.service';

@ApiTags('event-orders-public')
@Controller('event-orders')
export class PublicEventOrderController {
  constructor(private readonly orderService: EventOrderService) {}

  @Get('public/:orderCode')
  @ApiSuccessResponse(null, {
    description: 'Trạng thái đơn hàng (public, không cần eventId)',
  })
  findPublicByOrderCode(@Param('orderCode') orderCode: string) {
    return this.orderService.findPublicByOrderCode(orderCode);
  }
}
