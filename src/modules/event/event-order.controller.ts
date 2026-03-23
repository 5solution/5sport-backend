import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  ApiSuccessResponse,
  ApiCreatedSuccessResponse,
} from 'src/common/decorators/api-success-response.decorator';
import { Request } from 'express';
import { EventOrderService } from './event-order.service';
import { CreateEventOrderDto, InitPaymentDto } from './dto/create-event-order.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@ApiTags('event-orders')
@Controller('events/:eventId/orders')
export class EventOrderController {
  constructor(private readonly orderService: EventOrderService) {}

  @Post()
  @ApiCreatedSuccessResponse(null, {
    description: 'Tạo đơn hàng đăng ký sự kiện',
  })
  create(
    @Param('eventId') eventId: string,
    @Body() dto: CreateEventOrderDto,
  ) {
    return this.orderService.create(eventId, dto);
  }

  @Post(':orderCode/payment/init')
  @ApiCreatedSuccessResponse(null, {
    description: 'Khởi tạo thanh toán cho đơn hàng',
  })
  initPayment(
    @Param('eventId') eventId: string,
    @Param('orderCode') orderCode: string,
    @Body() dto: InitPaymentDto,
    @Req() req: Request,
  ) {
    const ipAddr =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    const returnUrl =
      dto.returnUrl ||
      `${process.env.FRONTEND_URL || 'http://localhost:3001'}/events/orders/payment/return?orderCode=${orderCode}`;

    return this.orderService.initPayment(
      eventId,
      orderCode,
      dto.paymentMethod,
      returnUrl,
      ipAddr,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  @ApiSuccessResponse(null, {
    description: 'Danh sách đơn hàng (phân trang)',
  })
  findAll(
    @Param('eventId') eventId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.orderService.findAllByEvent(
      eventId,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Get(':orderCode')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  @ApiSuccessResponse(null, {
    description: 'Chi tiết đơn hàng',
  })
  findOne(
    @Param('eventId') eventId: string,
    @Param('orderCode') orderCode: string,
  ) {
    return this.orderService.findByOrderCode(orderCode);
  }
}
