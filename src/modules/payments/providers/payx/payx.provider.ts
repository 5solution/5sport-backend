import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
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
import { PayxConfig } from './payx.config';

@Injectable()
export class PayxProvider implements IPaymentProvider {
  private readonly logger = new Logger(PayxProvider.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly config: PayxConfig,
  ) {}

  getProviderName(): string {
    return 'payx';
  }

  async createPayment(
    params: PaymentRequestParams,
  ): Promise<PaymentUrlResponse> {
    const displayMode =
      params.displayMode || PaymentDisplayMode.MERCHANT_HOSTED;

    // Validate returnUrl for hosted_form mode
    if (displayMode === PaymentDisplayMode.HOSTED_FORM && !params.returnUrl) {
      throw new Error('returnUrl is required when using hosted_form mode');
    }

    const paymentMethod = this.mapPaymentMethod(params.paymentMethod);
    const createdDate = new Date().toISOString();
    const expireDate = this.calculateExpireDate();

    const requestData = {
      merchantCode: this.config.merchantCode,
      amount: params.amount,
      orderId: params.orderId,
      description: params.description,
      returnUrl:
        displayMode === PaymentDisplayMode.HOSTED_FORM
          ? params.returnUrl
          : 'http://localhost:3001',
      callbackUrl: params.callbackUrl,
      paymentMethod,
      displayMode,
      ipAddr: params.ipAddr,
      createdDate,
      expireDate,
      secureHash: '',
    };

    // Generate secure hash (before adding it to the object)
    requestData.secureHash = this.generateRequestHash({
      merchantCode: requestData.merchantCode,
      amount: requestData.amount,
      orderId: requestData.orderId,
      description: requestData.description,
      returnUrl: requestData.returnUrl,
      callbackUrl: requestData.callbackUrl,
      ipAddr: requestData.ipAddr,
      createdDate: requestData.createdDate,
      expireDate: requestData.expireDate,
    });

    try {
      this.logger.debug(
        `[PAYX] Creating payment with request: ${JSON.stringify(requestData)}`,
      );

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.config.apiUrl}/api/v1/payments`,
          requestData,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      this.logger.debug(
        `[PAYX] Response received: ${JSON.stringify(response.data)}`,
      );

      // Verify response hash
      const responseHash = response.headers['x-secure-hash'];
      const isValid = this.verifyResponseHash(response.data, responseHash);

      if (!isValid) {
        this.logger.warn('Invalid response signature from PAYX');
        throw new Error('Invalid response signature from PAYX');
      }

      if (displayMode === PaymentDisplayMode.HOSTED_FORM) {
        // Return redirect URL
        return {
          paymentUrl: response.data.data.paymentUrl,
          paymentId: response.data.data.paymentId,
          displayMode: PaymentDisplayMode.HOSTED_FORM,
          amount: params.amount,
          expireDate: new Date(response.data.data.expiredDate),
        };
      } else {
        // Return QR/Bank info for merchant-hosted display
        return {
          paymentId: response.data.data.paymentId,
          qrCodeData: response.data.data.methodData.vietqrcontent,
          accountInfo: {
            accountNumber: response.data.data.methodData.accountnumber,
            accountName: response.data.data.methodData.accountname,
            bankShortName: response.data.data.methodData.bankshortname,
            bankFullName: response.data.data.methodData.bankfullname,
            transferDescription:
              response.data.data.methodData.transferdescription,
          },
          displayMode: PaymentDisplayMode.MERCHANT_HOSTED,
          amount: response.data.data.amount,
          expireDate: new Date(response.data.data.expireddate),
        };
      }
    } catch (error) {
      const errorData = (error as any).response?.data || (error as any).message;
      this.logger.error(
        `[PAYX] Payment creation failed: ${JSON.stringify(errorData)}`,
        (error as any).stack,
      );
      this.logger.error(`[PAYX] Request was: ${JSON.stringify(requestData)}`);
      throw error;
    }
  }

  async verifyCallback(params: PaymentCallbackParams): Promise<boolean> {
    const { secureHash, ...data } = params;
    const calculatedHash = this.generateCallbackHash(data);
    const isValid = calculatedHash === secureHash;

    if (!isValid) {
      this.logger.warn(
        `Invalid callback signature for order ${params.orderId}. Expected: ${secureHash}, Got: ${calculatedHash}`,
      );
    }

    return isValid;
  }

  async verifyReturn(
    params: Record<string, any>,
  ): Promise<PaymentInquiryResponse> {
    return {
      orderId: params.orderId,
      amount: params.amount,
      status: this.mapStatus(params.status),
      paymentMethod: params.paymentMethod,
      createdDate: new Date(params.createdDate),
      expireDate: new Date(params.expireDate),
      errorCode: params.errorCode,
      errorMessage: params.errorMessage,
    };
  }

  async inquirePayment(
    params: PaymentInquiryParams,
  ): Promise<PaymentInquiryResponse> {
    const requestData = {
      merchantCode: this.config.merchantCode,
      orderId: params.orderId,
      timestamp: new Date().toISOString(),
      secureHash: '',
    };

    requestData.secureHash = this.generateInquiryHash(requestData);

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.config.apiUrl}/api/v1/payments/inquiry`,
          requestData,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      // Verify response hash
      const responseHash = response.headers['x-secure-hash'];
      const isValid = this.verifyResponseHash(response.data, responseHash);

      if (!isValid) {
        this.logger.warn('Invalid response signature from PAYX inquiry');
        throw new Error('Invalid response signature from PAYX');
      }

      return {
        orderId: response.data.orderId,
        amount: response.data.amount,
        status: this.mapStatus(response.data.status),
        paymentMethod: response.data.paymentMethod,
        createdDate: new Date(response.data.createdDate),
        expireDate: new Date(response.data.expireDate),
        errorCode: response.data.errorCode,
        errorMessage: response.data.errorMessage,
      };
    } catch (error) {
      this.logger.error(
        'PAYX inquiry failed',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  // Private helper methods
  private generateRequestHash(data: any): string {
    const hashData = `${data.merchantCode}|${data.amount}|${data.orderId}|${data.description}|${data.returnUrl}|${data.callbackUrl}|${data.ipAddr}|${data.createdDate}|${data.expireDate}`;
    return crypto
      .createHmac('sha512', this.config.secretKey)
      .update(hashData)
      .digest('base64');
  }

  private generateCallbackHash(data: any): string {
    const hashData = `${data.merchantCode}|${data.amount}|${data.orderId}|${data.paymentMethod}|${data.createdDate}|${data.expireDate}|${data.status}|${data.errorCode || ''}|${data.errorMessage || ''}`;
    return crypto
      .createHmac('sha512', this.config.secretKey)
      .update(hashData)
      .digest('base64');
  }

  private generateInquiryHash(data: any): string {
    const hashData = `${data.merchantCode}|${data.orderId}|${data.timestamp}`;
    return crypto
      .createHmac('sha512', this.config.secretKey)
      .update(hashData)
      .digest('base64');
  }

  private verifyResponseHash(responseBody: any, receivedHash: string): boolean {
    const responseBodyString = JSON.stringify(responseBody);
    const calculatedHash = crypto
      .createHmac('sha512', this.config.secretKey)
      .update(responseBodyString)
      .digest('base64');
    return calculatedHash === receivedHash;
  }

  private mapPaymentMethod(method: string): string {
    if (method === 'PAYX_QR') return 'va_collection';
    if (method === 'PAYX_DOMESTIC') return 'domestic_card';
    return 'va_collection';
  }

  private mapStatus(status: string): PaymentTransactionStatus {
    const statusMap: Record<string, PaymentTransactionStatus> = {
      pending: PaymentTransactionStatus.PENDING,
      success: PaymentTransactionStatus.SUCCESS,
      failed: PaymentTransactionStatus.FAILED,
      cancelled: PaymentTransactionStatus.CANCELLED,
      expired: PaymentTransactionStatus.EXPIRED,
    };
    return statusMap[status] || PaymentTransactionStatus.PENDING;
  }

  private calculateExpireDate(): string {
    const now = new Date();
    const expire = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
    return expire.toISOString();
  }
}
