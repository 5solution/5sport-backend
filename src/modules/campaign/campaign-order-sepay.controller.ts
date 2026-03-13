import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiParam, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { OrderPublicResponseDto } from './dto/order-public-response.dto';
import { CampaignOrderService } from './campaign-order.service';
import { InitSepayPaymentDto } from './dto/init-sepay-payment.dto';
import { SepayIpnPayloadDto } from './dto/sepay-ipn-payload.dto';
import { SepayApiKeyGuard } from '../payments/providers/sepay/sepay-api-key.guard';

@ApiTags('campaign-orders-sepay')
@Controller()
export class CampaignOrderSepayController {
  constructor(private readonly orderService: CampaignOrderService) {}

  @Post('campaigns/:campaignId/orders/:orderCode/sepay/init')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initialize SePay payment for a campaign order' })
  @ApiParam({ name: 'campaignId', description: 'Campaign ID' })
  @ApiParam({ name: 'orderCode', description: 'Order code' })
  @ApiResponse({
    status: 200,
    description: 'Returns checkoutUrl and formFields to redirect user to SePay',
  })
  initPayment(
    @Param('campaignId') campaignId: string,
    @Param('orderCode') orderCode: string,
    @Body() _dto: InitSepayPaymentDto,
  ) {
    return this.orderService.initSepayPayment(campaignId, orderCode);
  }

  @Get('orders/:orderCode/public')
  @ApiOperation({ summary: 'Get public order summary (no auth required)' })
  @ApiParam({ name: 'orderCode', description: 'Order code' })
  @ApiOkResponse({ type: OrderPublicResponseDto })
  findOnePublic(@Param('orderCode') orderCode: string) {
    return this.orderService.findPublicByOrderCode(orderCode);
  }

  @Post('campaigns/orders/sepay/ipn')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SepayApiKeyGuard)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  @ApiOperation({ summary: 'SePay IPN webhook — receives payment confirmation from SePay' })
  @ApiSecurity('sepay-api-key')
  @ApiResponse({ status: 200, description: '{ success: true }' })
  processIpn(@Body() payload: SepayIpnPayloadDto) {
    return this.orderService.processSepayIpn(payload);
  }
}
