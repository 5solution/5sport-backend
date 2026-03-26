export enum PaymentDisplayMode {
  HOSTED_FORM = 'hosted_form',
  MERCHANT_HOSTED = 'merchant_hosted',
}

export enum PaymentTransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export interface PaymentRequestParams {
  amount: number;
  orderId: string;
  description: string;
  returnUrl?: string;
  callbackUrl: string;
  ipAddr: string;
  displayMode?: PaymentDisplayMode;
  paymentMethod: string;
}

export interface PaymentUrlResponse {
  paymentUrl?: string;
  paymentId?: string;
  formHtml?: string;
  qrCodeData?: string;
  accountInfo?: {
    accountNumber: string;
    accountName: string;
    bankShortName: string;
    bankFullName: string;
    transferDescription: string;
  };
  expireDate: Date;
  amount: number;
  displayMode: PaymentDisplayMode;
}

export interface PaymentCallbackParams {
  merchantCode: string;
  orderId: string;
  amount: number;
  paymentMethod: string;
  createdDate: string;
  expireDate: string;
  status: string;
  errorCode?: string;
  errorMessage?: string;
  secureHash: string;
  [key: string]: any;
}

export interface PaymentInquiryParams {
  orderId: string;
}

export interface PaymentInquiryResponse {
  orderId: string;
  amount: number;
  status: PaymentTransactionStatus;
  paymentMethod: string;
  createdDate: Date;
  expireDate: Date;
  errorCode?: string;
  errorMessage?: string;
}

export interface IPaymentProvider {
  createPayment(params: PaymentRequestParams): Promise<PaymentUrlResponse>;
  verifyCallback(params: PaymentCallbackParams): Promise<boolean>;
  verifyReturn(params: Record<string, any>): Promise<PaymentInquiryResponse>;
  inquirePayment(params: PaymentInquiryParams): Promise<PaymentInquiryResponse>;
  getProviderName(): string;
}
