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

  getProvider(paymentMethod: PaymentMethod | string): IPaymentProvider {
    // Normalize input: convert string to uppercase and handle variations
    let normalizedMethod = paymentMethod;

    if (typeof paymentMethod === 'string') {
      normalizedMethod = paymentMethod.toUpperCase();

      // Map common aliases to enum values
      const methodMap: Record<string, PaymentMethod> = {
        'VNPAY': PaymentMethod.VNPAY_QR,
        'VNPAY_QR': PaymentMethod.VNPAY_QR,
        'VNPAY_DOMESTIC': PaymentMethod.DOMESTIC_CARD,
        'DOMESTIC_CARD': PaymentMethod.DOMESTIC_CARD,
        'INTERNATIONAL_CARD': PaymentMethod.INTERNATIONAL_CARD,
        'PAYX': PaymentMethod.PAYX_QR,
        'PAYX_QR': PaymentMethod.PAYX_QR,
        'PAYX_DOMESTIC': PaymentMethod.PAYX_DOMESTIC,
      };

      normalizedMethod = methodMap[normalizedMethod] || (normalizedMethod as any);
    }

    switch (normalizedMethod) {
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
