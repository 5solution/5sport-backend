import { Injectable, Logger } from '@nestjs/common';
import { SePayPgClient } from 'sepay-pg-node';
import { env } from 'src/config';
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
export class SepayProvider implements IPaymentProvider {
  private readonly logger = new Logger(SepayProvider.name);
  private readonly client: SePayPgClient;

  constructor() {
    this.client = new SePayPgClient({
      env: env.sepay.env,
      merchant_id: env.sepay.merchantId,
      secret_key: env.sepay.secretKey,
    });
  }

  async createPayment(params: PaymentRequestParams): Promise<PaymentUrlResponse & { formFields: Record<string, any> }> {
    const formFields = this.client.checkout.initOneTimePaymentFields({
      operation: 'PURCHASE',
      payment_method: 'BANK_TRANSFER',
      order_invoice_number: params.orderId,
      order_amount: params.amount,
      currency: 'VND',
      order_description: params.description,
      success_url: `${env.appPublicBaseUrl}/group-tickets/orders/sepay/return?orderCode=${params.orderId}&status=success`,
      error_url: `${env.appPublicBaseUrl}/group-tickets/orders/sepay/return?orderCode=${params.orderId}&status=failed`,
      cancel_url: `${env.appPublicBaseUrl}/group-tickets/orders/sepay/return?orderCode=${params.orderId}&status=canceled`,
    });

    const checkoutUrl = this.client.checkout.initCheckoutUrl();

    return {
      paymentUrl: checkoutUrl,
      paymentId: params.orderId,
      expireDate: new Date(Date.now() + 60 * 60 * 1000),
      amount: params.amount,
      displayMode: PaymentDisplayMode.HOSTED_FORM,
      formFields,
    };
  }

  async verifyCallback(_params: PaymentCallbackParams): Promise<boolean> {
    return true;
  }

  async verifyReturn(params: Record<string, any>): Promise<PaymentInquiryResponse> {
    const status =
      params.status === 'success'
        ? PaymentTransactionStatus.SUCCESS
        : params.status === 'canceled'
          ? PaymentTransactionStatus.CANCELLED
          : PaymentTransactionStatus.FAILED;

    return {
      orderId: params.orderCode,
      amount: parseInt(params.amount ?? '0', 10),
      status,
      paymentMethod: 'SEPAY_BANK_TRANSFER',
      createdDate: new Date(),
      expireDate: new Date(),
    };
  }

  async inquirePayment(params: PaymentInquiryParams): Promise<PaymentInquiryResponse> {
    this.logger.warn(`SePay does not support direct payment inquiry for orderId: ${params.orderId}`);
    return {
      orderId: params.orderId,
      amount: 0,
      status: PaymentTransactionStatus.PENDING,
      paymentMethod: 'SEPAY_BANK_TRANSFER',
      createdDate: new Date(),
      expireDate: new Date(),
    };
  }

  getProviderName(): string {
    return 'sepay';
  }
}
