import { Injectable, BadRequestException } from '@nestjs/common';
import { PaymentMethod } from 'src/modules/event/enums/payment-method.enum';
import { IPaymentProvider } from './interfaces/payment-provider.interface';
import { VnpayProvider } from './providers/vnpay/vnpay.provider';
import { PayxProvider } from './providers/payx/payx.provider';

@Injectable()
export class PaymentFactory {
  constructor(
    private readonly vnpayProvider: VnpayProvider,
    private readonly payxProvider: PayxProvider,
  ) {}

  getProvider(paymentMethod: PaymentMethod): IPaymentProvider {
    switch (paymentMethod) {
      case PaymentMethod.VNPAY_QR:
      case PaymentMethod.DOMESTIC_CARD:
      case PaymentMethod.INTERNATIONAL_CARD:
        return this.vnpayProvider;

      case PaymentMethod.PAYX_QR:
      case PaymentMethod.PAYX_DOMESTIC:
        return this.payxProvider;

      default:
        throw new BadRequestException(`Unsupported payment method: ${paymentMethod}`);
    }
  }
}
