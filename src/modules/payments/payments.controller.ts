import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-url')
  createPaymentUrl(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.createPaymentUrl(createPaymentDto);
  }

  @Get(':paymentMethod/return')
  verifyReturn(@Param('paymentMethod') paymentMethod: string, @Query() queryParams: any) {
    return this.paymentsService.verifyPaymentReturn(paymentMethod, queryParams);
  }

  @Post(':paymentMethod/callback')
  handleCallback(@Param('paymentMethod') paymentMethod: string, @Body() callbackData: any) {
    return this.paymentsService.handleCallback(paymentMethod, callbackData);
  }

  @Get('inquiry/:orderId')
  inquirePayment(@Param('orderId') orderId: string) {
    return this.paymentsService.inquirePayment(orderId);
  }

  @Get('status/:orderId')
  getPaymentStatus(@Param('orderId') orderId: string) {
    return this.paymentsService.getPaymentByOrderId(orderId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentsService.remove(id);
  }
}
