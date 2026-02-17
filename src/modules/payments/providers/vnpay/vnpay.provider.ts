import { Injectable, NotImplementedException } from '@nestjs/common';
import { VnpayService } from 'nestjs-vnpay';
import {
  IPaymentProvider,
  PaymentRequestParams,
  PaymentUrlResponse,
  PaymentCallbackParams,
  PaymentInquiryParams,
  PaymentInquiryResponse,
  PaymentDisplayMode,
  PaymentTransactionStatus,
} from '../../interfaces/payment-provider.interface';

@Injectable()
export class VnpayProvider implements IPaymentProvider {
  constructor(private readonly vnpayService: VnpayService) {}

  getProviderName(): string {
    return 'vnpay';
  }

  async createPayment(params: PaymentRequestParams): Promise<PaymentUrlResponse> {
    const paymentUrl = this.vnpayService.buildPaymentUrl({
      vnp_Amount: params.amount,
      vnp_IpAddr: params.ipAddr,
      vnp_TxnRef: params.orderId,
      vnp_OrderInfo: params.description,
      vnp_ReturnUrl: params.returnUrl,
    });

    const expireDate = new Date();
    expireDate.setHours(expireDate.getHours() + 1);

    return {
      paymentUrl,
      displayMode: PaymentDisplayMode.HOSTED_FORM,
      amount: params.amount,
      expireDate,
    };
  }

  async verifyCallback(params: PaymentCallbackParams): Promise<boolean> {
    try {
      const result = await this.vnpayService.verifyIpnCall(params as any);
      return (result as any).isSuccess === true;
    } catch (error) {
      return false;
    }
  }

  async verifyReturn(params: Record<string, any>): Promise<PaymentInquiryResponse> {
    const verify = await this.vnpayService.verifyReturnUrl(params as any);

    return {
      orderId: params.vnp_TxnRef,
      amount: parseInt(params.vnp_Amount || '0') / 100,
      status: (verify as any).isSuccess ? PaymentTransactionStatus.SUCCESS : PaymentTransactionStatus.FAILED,
      paymentMethod: 'vnpay',
      createdDate: new Date(),
      expireDate: new Date(),
      errorCode: params.vnp_ResponseCode,
      errorMessage: (verify as any).message || '',
    };
  }

  async inquirePayment(params: PaymentInquiryParams): Promise<PaymentInquiryResponse> {
    throw new NotImplementedException('VNPay does not support inquiry API');
  }
}
