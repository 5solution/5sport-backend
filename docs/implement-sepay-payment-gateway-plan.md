# Implementation Plan: SePay Payment Gateway for Campaign Orders

## Table of Contents

1. [Overview](#1-overview)
2. [Current System Analysis](#2-current-system-analysis)
3. [Architecture Decision](#3-architecture-decision)
4. [Implementation Plan](#4-implementation-plan)
   - [Step 1: Install SePay SDK](#step-1-install-sepay-sdk)
   - [Step 2: Add SePay Environment Variables](#step-2-add-sepay-environment-variables)
   - [Step 3: Add SePay Provider to Payments Module](#step-3-add-sepay-provider-to-payments-module)
   - [Step 4: Update CampaignOrder Schema](#step-4-update-campaignorder-schema)
   - [Step 5: Add SePay Payment Endpoints to Campaign Module](#step-5-add-sepay-payment-endpoints-to-campaign-module)
   - [Step 6: Implement SePay IPN Webhook Handler](#step-6-implement-sepay-ipn-webhook-handler)
   - [Step 7: Wire Everything Together](#step-7-wire-everything-together)
5. [File Changes Summary](#5-file-changes-summary)
6. [Payment Flow](#6-payment-flow)
7. [API Reference](#7-api-reference)
8. [Testing Plan](#8-testing-plan)

---

## 1. Overview

Integrate the **SePay Payment Gateway** into the existing **Campaign module** so that users can pay for their campaign orders (athlete registration) via SePay bank transfer (VietQR).

**Key Principles:**
- Only modify files inside `src/modules/campaign/` for the campaign-specific logic
- Reuse the existing **Payments module** (`src/modules/payments/`) provider pattern by adding a new `SepayProvider`
- Use the existing `CampaignOrder` MongoDB schema — no new collections needed
- Follow the existing codebase patterns (Mongoose for campaign data, TypeORM for payment transactions)

**What we are building:**
1. A new `SepayProvider` inside the existing payments module (follows `IPaymentProvider` interface)
2. New endpoints in the campaign module for initiating SePay payments
3. An IPN webhook endpoint inside the campaign module for receiving SePay payment confirmations
4. Schema updates to track SePay-specific payment data on campaign orders

---

## 2. Current System Analysis

### Campaign Order Schema (`campaign-order.schema.ts`)

The `CampaignOrder` Mongoose schema already has payment-related fields:

| Field            | Type                  | Current Usage                        |
|------------------|-----------------------|--------------------------------------|
| `orderCode`      | `string` (unique)     | Auto-generated order code            |
| `totalAmount`    | `number`              | Sum of athlete unit prices           |
| `discountAmount` | `number`              | Discount applied (default 0)         |
| `finalAmount`    | `number`              | Amount to pay (total - discount)     |
| `paymentStatus`  | `CampaignOrderStatus` | `PENDING`, `PAID`, `FAILED`, `REFUNDED` |
| `paymentId`      | `string`              | Reference to payment transaction     |

### Campaign Order Status Enum

```typescript
export enum CampaignOrderStatus {
  PENDING  = 'PENDING',   // Order created, awaiting payment
  PAID     = 'PAID',      // Payment confirmed
  FAILED   = 'FAILED',    // Payment failed
  REFUNDED = 'REFUNDED',  // Payment refunded
}
```

### Existing Payments Module

The payments module uses a **Factory Pattern** (`PaymentFactory`) with an `IPaymentProvider` interface. Current providers:
- `VnpayProvider` — VNPay QR, domestic card, international card
- `PayxProvider` — PayX QR, PayX domestic

Each provider implements:
```typescript
interface IPaymentProvider {
  createPayment(params: PaymentRequestParams): Promise<PaymentUrlResponse>;
  verifyCallback(params: PaymentCallbackParams): Promise<boolean>;
  verifyReturn(params: Record<string, any>): Promise<PaymentInquiryResponse>;
  inquirePayment(params: PaymentInquiryParams): Promise<PaymentInquiryResponse>;
  getProviderName(): string;
}
```

### Database Architecture

- **Campaign data** → MongoDB (Mongoose) — `campaigns`, `campaignorders`, `campaigndiscounts`
- **Payment transactions** → PostgreSQL (TypeORM) — `payments` table

---

## 3. Architecture Decision

### Approach: Add SePay as a new provider in Payments module + Campaign-specific endpoints

```
┌──────────┐       ┌────────────────────────────────────┐       ┌────────────────┐
│  Client   │──1──▶│  Campaign Module                    │       │  SePay Gateway  │
│ (Browser) │      │  POST /campaigns/:id/orders         │       │                │
│           │      │  POST /campaigns/:id/orders/:code/  │──3──▶│  Checkout URL   │
│           │      │        sepay/init                    │       │                │
│           │◀─5───│  POST /campaigns/orders/sepay/ipn   │◀─4───│  IPN Callback   │
└──────────┘       └────────────────────────────────────┘       └────────────────┘
                            │  ▲                │  ▲
                         2  │  │  (read/write)  │  │ (create payment record)
                            ▼  │                ▼  │
                   ┌──────────────────┐  ┌──────────────────┐
                   │  MongoDB          │  │  PostgreSQL       │
                   │  campaignorders   │  │  payments         │
                   └──────────────────┘  └──────────────────┘
```

**Why this approach:**
- Keeps SePay SDK logic isolated in a reusable provider
- Campaign module only handles campaign-specific business logic
- Payment transaction history remains in PostgreSQL (consistent with existing VNPay/PayX flow)
- Campaign order status is updated in MongoDB via IPN callback
- Follows the existing codebase patterns — no architectural changes needed

---

## 4. Implementation Plan

### Step 1: Install SePay SDK

Install the `sepay-pg-node` npm package.

**File:** `package.json`

```bash
pnpm add sepay-pg-node
```

---

### Step 2: Add SePay Environment Variables

#### 2.1 Update Environment Config Validation

**File:** `src/config/index.ts`

Add SePay-related environment variables to the Joi validation schema:

```typescript
// Add to envVarsSchema .keys({...})
SEPAY_ENV: Joi.string().valid('sandbox', 'production').default('sandbox'),
SEPAY_MERCHANT_ID: Joi.string().required(),
SEPAY_SECRET_KEY: Joi.string().required(),
SEPAY_WEBHOOK_API_KEY: Joi.string().required(),
APP_PUBLIC_BASE_URL: Joi.string().default('http://localhost:3000'),
```

Add to the exported `env` object:

```typescript
sepay: {
  env: envVars.SEPAY_ENV,
  merchantId: envVars.SEPAY_MERCHANT_ID,
  secretKey: envVars.SEPAY_SECRET_KEY,
  webhookApiKey: envVars.SEPAY_WEBHOOK_API_KEY,
},
appPublicBaseUrl: envVars.APP_PUBLIC_BASE_URL,
```

#### 2.2 Update `.env` file

**File:** `.env` (and `env.example`)

```env
# SePay Payment Gateway
SEPAY_ENV=sandbox
SEPAY_MERCHANT_ID=your_merchant_id
SEPAY_SECRET_KEY=your_secret_key
SEPAY_WEBHOOK_API_KEY=your_webhook_api_key
APP_PUBLIC_BASE_URL=https://your-domain.com
```

---

### Step 3: Add SePay Provider to Payments Module

#### 3.1 Create SePay Provider

**New File:** `src/modules/payments/providers/sepay/sepay.provider.ts`

Implements `IPaymentProvider` interface using `sepay-pg-node` SDK.

```typescript
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
      env: env.sepay.env as 'sandbox' | 'production',
      merchant_id: env.sepay.merchantId,
      secret_key: env.sepay.secretKey,
    });
  }

  async createPayment(params: PaymentRequestParams): Promise<PaymentUrlResponse> {
    const formFields = this.client.checkout.initOneTimePaymentFields({
      operation: 'PURCHASE',
      payment_method: 'BANK_TRANSFER',
      order_invoice_number: params.orderId,
      order_amount: params.amount,
      currency: 'VND',
      order_description: params.description,
      success_url: `${env.appPublicBaseUrl}/campaigns/orders/sepay/return?orderCode=${params.orderId}&status=success`,
      error_url: `${env.appPublicBaseUrl}/campaigns/orders/sepay/return?orderCode=${params.orderId}&status=failed`,
      cancel_url: `${env.appPublicBaseUrl}/campaigns/orders/sepay/return?orderCode=${params.orderId}&status=canceled`,
    });

    const checkoutUrl = this.client.checkout.initCheckoutUrl();

    return {
      paymentUrl: checkoutUrl,
      paymentId: params.orderId,                        // SePay uses order_invoice_number as reference
      expireDate: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      amount: params.amount,
      displayMode: PaymentDisplayMode.HOSTED_FORM,
      // Store formFields in metadata for the auto-submit form
      formFields,
    } as PaymentUrlResponse & { formFields: Record<string, any> };
  }

  async verifyCallback(params: PaymentCallbackParams): Promise<boolean> {
    // SePay IPN verification is done via API key in the Authorization header
    // The SepayApiKeyGuard handles this, so if we reach here, it's already verified
    return true;
  }

  async verifyReturn(params: Record<string, any>): Promise<PaymentInquiryResponse> {
    // SePay redirects back with query params — extract status
    const status = params.status === 'success'
      ? PaymentTransactionStatus.SUCCESS
      : params.status === 'canceled'
        ? PaymentTransactionStatus.CANCELLED
        : PaymentTransactionStatus.FAILED;

    return {
      orderId: params.orderCode,
      amount: parseInt(params.amount ?? '0', 10),
      status,
      paymentMethod: 'SEPAY',
      createdDate: new Date(),
      expireDate: new Date(),
    };
  }

  async inquirePayment(params: PaymentInquiryParams): Promise<PaymentInquiryResponse> {
    // SePay does not provide a direct inquiry API — return based on local state
    this.logger.warn(`SePay does not support direct payment inquiry for orderId: ${params.orderId}`);
    return {
      orderId: params.orderId,
      amount: 0,
      status: PaymentTransactionStatus.PENDING,
      paymentMethod: 'SEPAY',
      createdDate: new Date(),
      expireDate: new Date(),
    };
  }

  getProviderName(): string {
    return 'sepay';
  }
}
```

#### 3.2 Create SePay API Key Guard

**New File:** `src/modules/payments/providers/sepay/sepay-api-key.guard.ts`

Validates the `Authorization: Apikey <key>` header on IPN requests using timing-safe comparison.

```typescript
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import * as crypto from 'crypto';
import { env } from 'src/config';

@Injectable()
export class SepayApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Apikey ')) {
      throw new UnauthorizedException('Missing or invalid SePay API key');
    }

    const providedKey = authHeader.slice('Apikey '.length);
    const expectedKey = env.sepay.webhookApiKey;

    if (!expectedKey) {
      throw new UnauthorizedException('SePay webhook API key not configured');
    }

    const providedBuf = Buffer.from(providedKey, 'utf8');
    const expectedBuf = Buffer.from(expectedKey, 'utf8');

    if (
      providedBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(providedBuf, expectedBuf)
    ) {
      throw new UnauthorizedException('Invalid SePay API key');
    }

    return true;
  }
}
```

#### 3.3 Update PaymentMethod Enum

**File:** `src/modules/event/enums/payment-method.enum.ts`

```typescript
export enum PaymentMethod {
  VNPAY_QR = 'VNPAY_QR',
  INTERNATIONAL_CARD = 'INTERNATIONAL_CARD',
  DOMESTIC_CARD = 'DOMESTIC_CARD',
  PAYX_QR = 'PAYX_QR',
  PAYX_DOMESTIC = 'PAYX_DOMESTIC',
  SEPAY_BANK_TRANSFER = 'SEPAY_BANK_TRANSFER',   // ← NEW
}
```

#### 3.4 Update PaymentFactory

**File:** `src/modules/payments/payment.factory.ts`

Add SePay to the factory:

```typescript
import { SepayProvider } from './providers/sepay/sepay.provider';

@Injectable()
export class PaymentFactory {
  constructor(
    private readonly vnpayProvider: VnpayProvider,
    private readonly payxProvider: PayxProvider,
    private readonly sepayProvider: SepayProvider,  // ← NEW
  ) {}

  getProvider(paymentMethod: PaymentMethod | string): IPaymentProvider {
    // Add to methodMap:
    // 'SEPAY': PaymentMethod.SEPAY_BANK_TRANSFER,
    // 'SEPAY_BANK_TRANSFER': PaymentMethod.SEPAY_BANK_TRANSFER,

    // Add to switch:
    // case PaymentMethod.SEPAY_BANK_TRANSFER:
    //   return this.sepayProvider;
  }
}
```

#### 3.5 Update PaymentsModule

**File:** `src/modules/payments/payments.module.ts`

Register `SepayProvider`:

```typescript
import { SepayProvider } from './providers/sepay/sepay.provider';

@Module({
  // ...existing imports...
  providers: [
    PaymentsService,
    PaymentFactory,
    VnpayProvider,
    PayxProvider,
    PayxConfig,
    SepayProvider,    // ← NEW
  ],
  exports: [PaymentsService, SepayProvider],  // ← Export SepayProvider for CampaignModule
})
export class PaymentsModule {}
```

---

### Step 4: Update CampaignOrder Schema

#### 4.1 Add Payment Provider Fields

**File:** `src/modules/campaign/schemas/campaign-order.schema.ts`

Add new fields to track SePay payment details:

```typescript
@Schema({ timestamps: true, collection: 'campaignorders' })
export class CampaignOrder {
  // ...existing fields...

  @Prop({ type: String, default: null })
  paymentProvider: string | null;       // 'sepay', 'vnpay', etc.

  @Prop({ type: String, default: null })
  providerTransactionId: string | null; // SePay's transaction ID

  @Prop({ type: Date, default: null })
  paidAt: Date | null;                  // When payment was confirmed

  @Prop({ type: Object, default: null })
  paymentMetadata: Record<string, any> | null; // Extra data from provider
}
```

**Why:** The existing `paymentId` field stores a reference to the PostgreSQL `payments` table. The new fields store provider-specific data directly on the campaign order for quick access without joining across databases.

#### 4.2 Add CANCELED Status

**File:** `src/modules/campaign/enums/campaign-order-status.enum.ts`

```typescript
export enum CampaignOrderStatus {
  PENDING  = 'PENDING',
  PAID     = 'PAID',
  FAILED   = 'FAILED',
  CANCELED = 'CANCELED',    // ← NEW (user canceled payment)
  REFUNDED = 'REFUNDED',
}
```

---

### Step 5: Add SePay Payment Endpoints to Campaign Module

#### 5.1 Create DTOs

**New File:** `src/modules/campaign/dto/init-sepay-payment.dto.ts`

```typescript
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class InitSepayPaymentDto {
  @ApiPropertyOptional({
    description: 'Payment method (default: BANK_TRANSFER)',
    example: 'BANK_TRANSFER',
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}
```

**New File:** `src/modules/campaign/dto/sepay-ipn-payload.dto.ts`

```typescript
import { IsInt, IsString, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SepayIpnOrderDto {
  @IsString()
  id: string;

  @IsString()
  order_id: string;

  @IsString()
  order_status: string;

  @IsString()
  order_currency: string;

  @IsString()
  order_amount: string;

  @IsString()
  @IsNotEmpty()
  order_invoice_number: string;   // Maps to our orderCode

  @IsOptional()
  custom_data?: any;

  @IsOptional()
  order_description?: string;
}

export class SepayIpnTransactionDto {
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  payment_method?: string;

  @IsString()
  transaction_id: string;

  @IsOptional()
  @IsString()
  transaction_type?: string;

  @IsOptional()
  @IsString()
  transaction_date?: string;

  @IsOptional()
  @IsString()
  transaction_status?: string;

  @IsOptional()
  @IsString()
  transaction_amount?: string;

  @IsOptional()
  @IsString()
  transaction_currency?: string;
}

export class SepayIpnPayloadDto {
  @IsInt()
  timestamp: number;

  @IsString()
  @IsNotEmpty()
  notification_type: string;

  @ValidateNested()
  @Type(() => SepayIpnOrderDto)
  order: SepayIpnOrderDto;

  @ValidateNested()
  @Type(() => SepayIpnTransactionDto)
  transaction: SepayIpnTransactionDto;

  @IsOptional()
  customer?: any;

  @IsOptional()
  agreement?: any;
}
```

#### 5.2 Add SePay Methods to CampaignOrderService

**File:** `src/modules/campaign/campaign-order.service.ts`

Add three new methods to the existing service:

```typescript
import { ConflictException } from '@nestjs/common';
import { SepayProvider } from '../payments/providers/sepay/sepay.provider';
import { SepayIpnPayloadDto } from './dto/sepay-ipn-payload.dto';

@Injectable()
export class CampaignOrderService {
  constructor(
    @InjectModel(CampaignOrder.name) private orderModel: Model<CampaignOrderDocument>,
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    private readonly sepayProvider: SepayProvider,       // ← Inject
  ) {}

  // ...existing methods...

  /**
   * Find a campaign order by orderCode.
   * Throws NotFoundException if not found.
   */
  async findByOrderCode(orderCode: string): Promise<CampaignOrderDocument> {
    const order = await this.orderModel.findOne({ orderCode });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  /**
   * Initialize SePay payment for a campaign order.
   * Returns checkoutUrl + formFields for the client to redirect to SePay.
   */
  async initSepayPayment(orderCode: string): Promise<{
    orderCode: string;
    checkoutUrl: string;
    formFields: Record<string, any>;
  }> {
    const order = await this.findByOrderCode(orderCode);

    // Prevent re-payment of already paid/refunded orders
    if (order.paymentStatus === CampaignOrderStatus.PAID) {
      throw new ConflictException('Order is already paid');
    }
    if (order.paymentStatus === CampaignOrderStatus.REFUNDED) {
      throw new ConflictException('Order has been refunded');
    }

    // Use SePay provider to create payment
    const paymentResponse = await this.sepayProvider.createPayment({
      amount: order.finalAmount,
      orderId: order.orderCode,
      description: `Payment for order ${order.orderCode}`,
      returnUrl: '',
      callbackUrl: '',
      ipAddr: '127.0.0.1',
      paymentMethod: 'SEPAY_BANK_TRANSFER',
    });

    // Update order with payment provider info
    order.paymentProvider = 'sepay';
    order.paymentStatus = CampaignOrderStatus.PENDING;
    await order.save();

    return {
      orderCode: order.orderCode,
      checkoutUrl: paymentResponse.paymentUrl,
      formFields: (paymentResponse as any).formFields,
    };
  }

  /**
   * Process SePay IPN webhook.
   * Atomically updates order to PAID if currently in PENDING state.
   * Always returns { success: true } (required by SePay).
   */
  async processSepayIpn(payload: SepayIpnPayloadDto): Promise<{ success: true }> {
    const invoiceNumber = payload.order.order_invoice_number;

    // Only process ORDER_PAID notifications
    if (payload.notification_type !== 'ORDER_PAID') {
      return { success: true };
    }

    // Find the order — return 200 even if not found
    const order = await this.orderModel.findOne({ orderCode: invoiceNumber });
    if (!order) {
      return { success: true };
    }

    // Skip if already in terminal state (idempotent)
    if ([CampaignOrderStatus.PAID, CampaignOrderStatus.FAILED, CampaignOrderStatus.REFUNDED].includes(order.paymentStatus)) {
      return { success: true };
    }

    // Atomic update: only update if status is still PENDING
    const result = await this.orderModel.updateOne(
      {
        _id: order._id,
        paymentStatus: CampaignOrderStatus.PENDING,
      },
      {
        $set: {
          paymentStatus: CampaignOrderStatus.PAID,
          paymentProvider: 'sepay',
          providerTransactionId: payload.transaction.transaction_id,
          paidAt: payload.transaction.transaction_date
            ? new Date(payload.transaction.transaction_date)
            : new Date(),
          paymentMetadata: {
            sepayOrderId: payload.order.id,
            sepayTransactionId: payload.transaction.id,
            transactionDate: payload.transaction.transaction_date,
            transactionAmount: payload.transaction.transaction_amount,
            paymentMethod: payload.transaction.payment_method,
          },
        },
      },
    );

    if (result.modifiedCount > 0) {
      // Log successful payment
      Logger.log(`Order ${invoiceNumber} marked as PAID via SePay IPN`, 'CampaignOrderService');
    }

    return { success: true };
  }
}
```

#### 5.3 Create SePay Payment Controller

**New File:** `src/modules/campaign/campaign-order-sepay.controller.ts`

```typescript
import {
  Controller, Post, Get, Param, Body, HttpCode, HttpStatus,
  Header, UsePipes, ValidationPipe, UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CampaignOrderService } from './campaign-order.service';
import { InitSepayPaymentDto } from './dto/init-sepay-payment.dto';
import { SepayIpnPayloadDto } from './dto/sepay-ipn-payload.dto';
import { SepayApiKeyGuard } from '../payments/providers/sepay/sepay-api-key.guard';

@ApiTags('campaign-orders-sepay')
@Controller()
export class CampaignOrderSepayController {
  constructor(private readonly orderService: CampaignOrderService) {}

  /**
   * Initialize SePay payment for a campaign order.
   * Returns checkoutUrl + formFields.
   */
  @Post('campaigns/:campaignId/orders/:orderCode/sepay/init')
  @HttpCode(HttpStatus.OK)
  initPayment(
    @Param('orderCode') orderCode: string,
    @Body() dto: InitSepayPaymentDto,
  ) {
    return this.orderService.initSepayPayment(orderCode);
  }

  /**
   * SePay IPN Webhook endpoint.
   * Receives payment confirmation from SePay.
   * Protected by API key guard.
   */
  @Post('campaigns/orders/sepay/ipn')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SepayApiKeyGuard)
  @UsePipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false,  // SePay may send extra fields
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }))
  processIpn(@Body() payload: SepayIpnPayloadDto) {
    return this.orderService.processSepayIpn(payload);
  }

  /**
   * Debug helper: Auto-submit HTML form to SePay.
   * FOR DEVELOPMENT/TESTING ONLY.
   */
  @Get('campaigns/:campaignId/orders/:orderCode/sepay/pay')
  @Header('Content-Type', 'text/html')
  async getPayForm(@Param('orderCode') orderCode: string) {
    const { checkoutUrl, formFields } = await this.orderService.initSepayPayment(orderCode);
    const hiddenFields = Object.entries(formFields)
      .map(([k, v]) => `<input type="hidden" name="${k}" value="${v}" />`)
      .join('\n');
    return `
      <html>
        <body onload="document.getElementById('f').submit()">
          <form id="f" method="POST" action="${checkoutUrl}">
            ${hiddenFields}
          </form>
          <p>Redirecting to SePay...</p>
        </body>
      </html>
    `;
  }
}
```

---

### Step 6: Implement SePay IPN Webhook Handler

Already handled in **Step 5.2** (`processSepayIpn` method) and **Step 5.3** (IPN endpoint).

**Key design decisions:**
- **Always return HTTP 200** with `{ success: true }` — prevents SePay from retrying endlessly
- **Idempotent processing** — duplicate IPNs for the same order are safely ignored
- **Atomic update** — uses MongoDB `updateOne` with `paymentStatus: PENDING` filter to prevent race conditions
- **API Key validation** — `SepayApiKeyGuard` uses timing-safe comparison

---

### Step 7: Wire Everything Together

#### 7.1 Update CampaignModule

**File:** `src/modules/campaign/campaign.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Campaign, CampaignSchema } from './schemas/campaign.schema';
import { CampaignOrder, CampaignOrderSchema } from './schemas/campaign-order.schema';

import { CampaignController } from './campaign.controller';
import { CampaignOrderController } from './campaign-order.controller';
import { CampaignOrderSepayController } from './campaign-order-sepay.controller'; // ← NEW

import { CampaignService } from './campaign.service';
import { CampaignOrderService } from './campaign-order.service';

import { PaymentsModule } from '../payments/payments.module';  // ← NEW

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Campaign.name, schema: CampaignSchema },
      { name: CampaignOrder.name, schema: CampaignOrderSchema },
    ]),
    PaymentsModule,  // ← NEW: Import to access SepayProvider
  ],
  controllers: [
    CampaignController,
    CampaignOrderController,
    CampaignOrderSepayController,  // ← NEW
  ],
  providers: [
    CampaignService,
    CampaignOrderService,
  ],
  exports: [CampaignService, CampaignOrderService],
})
export class CampaignModule {}
```

No changes needed to `AppModule` — `CampaignModule` and `PaymentsModule` are already registered.

---

## 5. File Changes Summary

### New Files (4 files)

| File | Description |
|------|-------------|
| `src/modules/payments/providers/sepay/sepay.provider.ts` | SePay SDK wrapper implementing `IPaymentProvider` |
| `src/modules/payments/providers/sepay/sepay-api-key.guard.ts` | IPN webhook API key guard |
| `src/modules/campaign/dto/init-sepay-payment.dto.ts` | DTO for init payment request |
| `src/modules/campaign/dto/sepay-ipn-payload.dto.ts` | DTO for SePay IPN webhook payload |
| `src/modules/campaign/campaign-order-sepay.controller.ts` | SePay-specific endpoints for campaign orders |

### Modified Files (7 files)

| File | Change |
|------|--------|
| `package.json` | Add `sepay-pg-node` dependency |
| `src/config/index.ts` | Add SePay env vars validation + export |
| `env.example` | Add SePay environment variables |
| `src/modules/event/enums/payment-method.enum.ts` | Add `SEPAY_BANK_TRANSFER` |
| `src/modules/payments/payment.factory.ts` | Add SePay to factory switch |
| `src/modules/payments/payments.module.ts` | Register + export `SepayProvider` |
| `src/modules/campaign/schemas/campaign-order.schema.ts` | Add `paymentProvider`, `providerTransactionId`, `paidAt`, `paymentMetadata` fields |
| `src/modules/campaign/enums/campaign-order-status.enum.ts` | Add `CANCELED` status |
| `src/modules/campaign/campaign-order.service.ts` | Add `findByOrderCode`, `initSepayPayment`, `processSepayIpn` methods |
| `src/modules/campaign/campaign.module.ts` | Import `PaymentsModule`, register `CampaignOrderSepayController` |

---

## 6. Payment Flow

### Complete Sequence Diagram

```
Client                Campaign Module           MongoDB              SePay Gateway
  │                        │                      │                       │
  │  1. POST /campaigns/:id/orders               │                       │
  │  { lastName, firstName, athletes, ... }      │                       │
  │───────────────────────▶│                      │                       │
  │                        │  2. INSERT order      │                       │
  │                        │  paymentStatus=PENDING│                       │
  │                        │─────────────────────▶│                       │
  │                        │◀─────────────────────│                       │
  │◀───────────────────────│                      │                       │
  │  { orderCode, finalAmount, ... }             │                       │
  │                        │                      │                       │
  │  3. POST /campaigns/:id/orders/:code/sepay/init                      │
  │───────────────────────▶│                      │                       │
  │                        │  4. SePay SDK         │                       │
  │                        │  generate formFields  │                       │
  │                        │──────────────────────────────────────────────▶│
  │                        │◀──────────────────────────────────────────────│
  │                        │  5. Update provider   │                       │
  │                        │  paymentProvider=sepay│                       │
  │                        │─────────────────────▶│                       │
  │◀───────────────────────│                      │                       │
  │  { checkoutUrl,        │                      │                       │
  │    formFields }        │                      │                       │
  │                        │                      │                       │
  │  6. POST to checkoutUrl with formFields (browser redirect)           │
  │──────────────────────────────────────────────────────────────────────▶│
  │                        │                      │                       │
  │  7. Customer pays on SePay page                                       │
  │◀──────────────────────────────────────────────────────────────────────│
  │  (redirect to success_url / error_url)                                │
  │                        │                      │                       │
  │                        │  8. SePay IPN         │                       │
  │                        │  POST /campaigns/orders/sepay/ipn            │
  │                        │◀──────────────────────────────────────────────│
  │                        │  { notification_type: "ORDER_PAID",          │
  │                        │    order: { order_invoice_number: code } }   │
  │                        │                      │                       │
  │                        │  9. Find order by     │                       │
  │                        │  orderCode            │                       │
  │                        │─────────────────────▶│                       │
  │                        │◀─────────────────────│                       │
  │                        │                      │                       │
  │                        │  10. Atomic update    │                       │
  │                        │  PENDING → PAID       │                       │
  │                        │─────────────────────▶│                       │
  │                        │◀─────────────────────│                       │
  │                        │                      │                       │
  │                        │  11. Return 200       │                       │
  │                        │  { success: true }    │                       │
  │                        │──────────────────────────────────────────────▶│
```

### Status Transitions

```
  ┌──────────┐
  │ PENDING  │ ─── Order created (create order endpoint)
  └────┬─────┘
       │
       ├──── IPN (ORDER_PAID) ──────▶ ┌──────┐
       │                               │ PAID │
       │                               └──────┘
       │
       ├──── (future: payment failed) ▶ ┌────────┐
       │                                 │ FAILED │
       │                                 └────────┘
       │
       ├──── (future: user cancels)  ──▶ ┌──────────┐
       │                                 │ CANCELED │
       │                                 └──────────┘
       │
       └──── (admin refund)  ──────────▶ ┌──────────┐
                                         │ REFUNDED │
                                         └──────────┘
```

| From      | To        | Trigger                                |
|-----------|-----------|----------------------------------------|
| `PENDING` | `PAID`    | `processSepayIpn()` — IPN ORDER_PAID   |
| `PENDING` | `FAILED`  | Future: failure notification            |
| `PENDING` | `CANCELED`| Future: user cancellation               |
| `PAID`    | `REFUNDED`| Future: admin refund                    |

**Terminal states:** `PAID`, `FAILED`, `CANCELED`, `REFUNDED` — no further payment transitions.

---

## 7. API Reference

### Initialize SePay Payment

```
POST /campaigns/:campaignId/orders/:orderCode/sepay/init
Content-Type: application/json
```

**Request Body (optional):**
```json
{
  "paymentMethod": "BANK_TRANSFER"
}
```

**Response (200):**
```json
{
  "orderCode": "ORD-M6X2K4-AB1C",
  "checkoutUrl": "https://pg.sepay.vn/checkout",
  "formFields": {
    "merchant_id": "...",
    "operation": "PURCHASE",
    "order_invoice_number": "ORD-M6X2K4-AB1C",
    "order_amount": 500000,
    "currency": "VND",
    "...": "..."
  }
}
```

### SePay IPN Webhook

```
POST /campaigns/orders/sepay/ipn
Content-Type: application/json
Authorization: Apikey <SEPAY_WEBHOOK_API_KEY>
```

**Request Body (sent by SePay):**
```json
{
  "timestamp": 1759134682,
  "notification_type": "ORDER_PAID",
  "order": {
    "id": "e2c195be-...",
    "order_id": "NQD-...",
    "order_status": "CAPTURED",
    "order_currency": "VND",
    "order_amount": "500000.00",
    "order_invoice_number": "ORD-M6X2K4-AB1C"
  },
  "transaction": {
    "id": "384c66dd-...",
    "payment_method": "BANK_TRANSFER",
    "transaction_id": "68da43da2d9de",
    "transaction_date": "2026-03-12 15:31:22",
    "transaction_status": "APPROVED",
    "transaction_amount": "500000"
  },
  "customer": null,
  "agreement": null
}
```

**Response (200):**
```json
{
  "success": true
}
```

### Debug: Auto-Submit Pay Form

```
GET /campaigns/:campaignId/orders/:orderCode/sepay/pay
```

Returns HTML that auto-submits to SePay. **For development/testing only.**

### Existing Endpoints (unchanged)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/campaigns/:campaignId/orders` | Create a new campaign order |
| GET | `/campaigns/:campaignId/orders` | List orders (admin/organizer) |
| GET | `/campaigns/:campaignId/orders/:id` | Get order detail (admin/organizer) |

---

## 8. Testing Plan

### Local Development Setup

1. **Install dependency:**
   ```bash
   pnpm add sepay-pg-node
   ```

2. **Add env vars to `.env`:**
   ```env
   SEPAY_ENV=sandbox
   SEPAY_MERCHANT_ID=<your_merchant_id>
   SEPAY_SECRET_KEY=<your_secret_key>
   SEPAY_WEBHOOK_API_KEY=<your_webhook_api_key>
   APP_PUBLIC_BASE_URL=https://<ngrok-id>.ngrok.io
   ```

3. **Start the app:**
   ```bash
   pnpm start:dev
   ```

4. **Expose via ngrok:**
   ```bash
   ngrok http 3000
   ```

5. **Configure SePay dashboard:**
   - IPN URL: `https://<ngrok-id>.ngrok.io/campaigns/orders/sepay/ipn`
   - API Key: same value as `SEPAY_WEBHOOK_API_KEY`

### Test Scenario: Complete Payment

```bash
# Step 1: Create a campaign order
curl -X POST http://localhost:3000/campaigns/<campaignId>/orders \
  -H "Content-Type: application/json" \
  -d '{
    "lastName": "Nguyen",
    "firstName": "Van A",
    "email": "test@example.com",
    "phoneNumber": "0901234567",
    "athletes": [
      {
        "distance": "5",
        "lastName": "Nguyen",
        "firstName": "Van A",
        "phoneNumber": "0901234567"
      }
    ]
  }'
# → Note the orderCode in response

# Step 2: Initialize SePay payment
curl -X POST http://localhost:3000/campaigns/<campaignId>/orders/<orderCode>/sepay/init \
  -H "Content-Type: application/json" \
  -d '{}'

# Step 3: Open auto-submit form in browser (dev only)
open http://localhost:3000/campaigns/<campaignId>/orders/<orderCode>/sepay/pay

# Step 4: Complete payment on SePay sandbox
# → SePay sends IPN to your ngrok URL

# Step 5: Verify order status
curl http://localhost:3000/campaigns/<campaignId>/orders?paymentStatus=PAID
# → Order should have paymentStatus=PAID
```

### Simulate IPN Locally

```bash
curl -X POST http://localhost:3000/campaigns/orders/sepay/ipn \
  -H "Content-Type: application/json" \
  -H "Authorization: Apikey <your_webhook_api_key>" \
  -d '{
    "timestamp": 1759134682,
    "notification_type": "ORDER_PAID",
    "order": {
      "id": "test-uuid",
      "order_id": "NQD-TEST",
      "order_status": "CAPTURED",
      "order_currency": "VND",
      "order_amount": "500000.00",
      "order_invoice_number": "<orderCode>"
    },
    "transaction": {
      "id": "test-txn-uuid",
      "payment_method": "BANK_TRANSFER",
      "transaction_id": "test-txn-id",
      "transaction_type": "PAYMENT",
      "transaction_date": "2026-03-12 15:31:22",
      "transaction_status": "APPROVED",
      "transaction_amount": "500000",
      "transaction_currency": "VND"
    },
    "customer": null,
    "agreement": null
  }'
```

### Security Checklist

- [ ] `SepayApiKeyGuard` validates IPN requests with timing-safe comparison
- [ ] IPN endpoint uses `forbidNonWhitelisted: false` to tolerate extra SePay fields
- [ ] Atomic MongoDB `updateOne` prevents race conditions on duplicate IPNs
- [ ] Terminal states (`PAID`, `FAILED`, `REFUNDED`) block re-processing
- [ ] IPN always returns HTTP 200 to prevent SePay retries
- [ ] HTTPS required for production IPN URL
