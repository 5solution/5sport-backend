# Implement SePay Payment Gateway in NestJS

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Prerequisites](#3-prerequisites)
4. [Project Structure](#4-project-structure)
5. [Step-by-Step Implementation](#5-step-by-step-implementation)
   - [Step 1: Environment Configuration](#step-1-environment-configuration)
   - [Step 2: Database Setup & Migration](#step-2-database-setup--migration)
   - [Step 3: Payment Order Module](#step-3-payment-order-module)
   - [Step 4: SePay Module](#step-4-sepay-module)
   - [Step 5: Wire Everything in AppModule](#step-5-wire-everything-in-appmodule)
   - [Step 6: Bootstrap the Application](#step-6-bootstrap-the-application)
6. [Payment Flow](#6-payment-flow)
7. [API Reference](#7-api-reference)
8. [IPN Webhook Details](#8-ipn-webhook-details)
9. [Status Transitions](#9-status-transitions)
10. [Security Considerations](#10-security-considerations)
11. [Testing the Full Flow](#11-testing-the-full-flow)
12. [Docker Deployment](#12-docker-deployment)

---

## 1. Overview

This document describes the full flow to integrate the **SePay Payment Gateway** into a NestJS project. The implementation covers:

- Creating payment orders in the local database
- Initiating payments through SePay's checkout flow
- Receiving and processing IPN (Instant Payment Notification) webhooks from SePay
- Atomically updating order statuses with idempotency guarantees

**Tech Stack:**
- **Runtime:** Node.js
- **Framework:** NestJS 10
- **Database:** MySQL 8.0 (via TypeORM)
- **SePay SDK:** `sepay-pg-node`
- **Validation:** class-validator + class-transformer

---

## 2. Architecture

```
┌──────────┐       ┌──────────────────────┐       ┌────────────────┐
│  Client   │──1──▶│  NestJS Application  │──3──▶│  SePay Gateway  │
│ (Browser) │      │                      │       │                │
│           │◀─5───│  /payments/sepay/*   │◀─4───│  IPN Callback   │
└──────────┘       └──────────────────────┘       └────────────────┘
                            │  ▲
                         2  │  │  (read/write)
                            ▼  │
                   ┌──────────────────┐
                   │   MySQL Database  │
                   │  payment_orders   │
                   └──────────────────┘
```

**Flow Summary:**
1. Client creates a payment order via REST API
2. Order is persisted in MySQL with status `CREATED`
3. Client initiates SePay payment → application generates checkout URL/form fields
4. After customer pays, SePay sends IPN webhook to the application
5. Application processes IPN, marks order as `PAID`, and returns HTTP 200

---

## 3. Prerequisites

- Node.js >= 18
- MySQL 8.0+
- A SePay merchant account with:
  - `SEPAY_MERCHANT_ID`
  - `SEPAY_SECRET_KEY`
  - `SEPAY_WEBHOOK_API_KEY` (configured in SePay dashboard)
- HTTPS-enabled public URL for receiving IPN webhooks (use ngrok for local dev)

### Install Dependencies

```bash
npm install @nestjs/common @nestjs/core @nestjs/platform-express \
            @nestjs/config @nestjs/typeorm @nestjs/swagger \
            typeorm mysql2 \
            class-validator class-transformer \
            reflect-metadata rxjs \
            sepay-pg-node
```

---

## 4. Project Structure

```
src/
├── main.ts                              # Bootstrap & Swagger setup
├── app.module.ts                        # Root module
├── common/
│   └── dto/
│       ├── pagination-response.dto.ts   # Generic paginated response wrapper
│       └── single-response.dto.ts       # Generic single-item response wrapper
├── config/
│   ├── database.config.ts               # TypeORM database config
│   └── sepay.config.ts                  # SePay environment config
└── modules/
    ├── payment-order/                   # Internal order management
    │   ├── payment-order.module.ts
    │   ├── payment-order.controller.ts
    │   ├── payment-order.service.ts
    │   ├── dto/
    │   │   ├── create-payment-order.dto.ts
    │   │   └── query-payment-order.dto.ts
    │   ├── entities/
    │   │   └── payment-order.entity.ts
    │   └── enums/
    │       └── payment-order-status.enum.ts
    └── sepay/                           # SePay gateway integration
        ├── sepay.module.ts
        ├── sepay.controller.ts          # Init payment endpoints
        ├── sepay-ipn.controller.ts      # IPN webhook endpoint
        ├── sepay.service.ts             # Core payment & IPN logic
        ├── sepay-client.provider.ts     # SePayPgClient factory provider
        ├── dto/
        │   ├── init-sepay-payment.dto.ts
        │   └── sepay-ipn-payload.dto.ts
        ├── guards/
        │   └── sepay-api-key.guard.ts   # Webhook authentication guard
        └── interfaces/
            └── ipn-result.interface.ts

database/
├── data-source.ts                       # TypeORM CLI data source
└── migrations/
    └── 1741478400000-CreatePaymentOrdersTable.ts
```

---

## 5. Step-by-Step Implementation

### Step 1: Environment Configuration

Create a `.env` file in the project root:

```env
# Application
APP_PORT=3000
APP_PUBLIC_BASE_URL=https://your-domain.com   # Public URL for SePay redirects

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=sepay_integration

# SePay
SEPAY_ENV=sandbox                              # sandbox | production
SEPAY_MERCHANT_ID=your_merchant_id
SEPAY_SECRET_KEY=your_secret_key
SEPAY_WEBHOOK_API_KEY=your_webhook_api_key     # Set in SePay dashboard IPN config
```

#### `src/config/database.config.ts`

Registers TypeORM configuration from environment variables:

```typescript
import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'mysql',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '3306', 10),
    username: process.env.DB_USERNAME ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'sepay_integration',
    entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
    migrations: [join(__dirname, '..', '..', 'database', 'migrations', '*.{ts,js}')],
    synchronize: false,
    logging: process.env.NODE_ENV !== 'production',
    charset: 'utf8mb4',
  }),
);
```

#### `src/config/sepay.config.ts`

Registers SePay-specific configuration:

```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('sepay', () => ({
  env: (process.env.SEPAY_ENV ?? 'sandbox') as 'sandbox' | 'production',
  merchantId: process.env.SEPAY_MERCHANT_ID ?? '',
  secretKey: process.env.SEPAY_SECRET_KEY ?? '',
  appPublicBaseUrl: process.env.APP_PUBLIC_BASE_URL ?? 'http://localhost:3000',
  webhookApiKey: process.env.SEPAY_WEBHOOK_API_KEY ?? '',
}));
```

---

### Step 2: Database Setup & Migration

#### `database/data-source.ts`

TypeORM CLI data source for running migrations:

```typescript
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '3306', 10),
  username: process.env.DB_USERNAME ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'sepay_integration',
  entities: [join(__dirname, '..', 'src', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false,
  logging: true,
  charset: 'utf8mb4',
});
```

#### Migration: `payment_orders` Table

The `payment_orders` table stores all order data and tracks payment lifecycle:

| Column             | Type                  | Description                                    |
|--------------------|-----------------------|------------------------------------------------|
| `id`               | BIGINT UNSIGNED PK AI | Auto-increment primary key                     |
| `order_code`       | VARCHAR(64) UNIQUE    | Merchant's unique order code                   |
| `provider`         | VARCHAR(32) NULL      | Payment provider name (e.g. `sepay`)           |
| `provider_order_id`| VARCHAR(128) NULL     | Provider's transaction/order ID                |
| `amount`           | DECIMAL(15,2)         | Payment amount                                 |
| `currency`         | VARCHAR(10)           | Currency code (default `VND`)                  |
| `status`           | ENUM                  | `CREATED`, `PENDING`, `PAID`, `FAILED`, `CANCELED` |
| `customer_id`      | VARCHAR(64) NULL      | Optional customer identifier                   |
| `description`      | VARCHAR(255) NULL     | Order description                              |
| `metadata`         | JSON NULL             | Arbitrary metadata                             |
| `paid_at`          | DATETIME NULL         | Timestamp when payment was confirmed           |
| `created_at`       | DATETIME              | Record creation timestamp                      |
| `updated_at`       | DATETIME              | Record last update timestamp                   |

**Indexes:** `status`, `customer_id`, `created_at`

Run the migration:

```bash
npm run migration:run
```

---

### Step 3: Payment Order Module

This module manages the lifecycle of payment orders independently from any payment gateway.

#### 3.1 Entity — `payment-order.entity.ts`

```typescript
@Entity('payment_orders')
export class PaymentOrder {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'order_code', type: 'varchar', length: 64, unique: true })
  orderCode: string;

  @Column({ name: 'provider', type: 'varchar', length: 32, nullable: true })
  provider: string | null;

  @Column({ name: 'provider_order_id', type: 'varchar', length: 128, nullable: true })
  providerOrderId: string | null;

  @Column({ name: 'amount', type: 'decimal', precision: 15, scale: 2 })
  amount: string;

  @Column({ name: 'currency', type: 'varchar', length: 10, default: 'VND' })
  currency: string;

  @Column({ name: 'status', type: 'enum', enum: PaymentOrderStatus, default: PaymentOrderStatus.CREATED })
  status: PaymentOrderStatus;

  @Column({ name: 'customer_id', type: 'varchar', length: 64, nullable: true })
  customerId: string | null;

  @Column({ name: 'description', type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @Column({ name: 'metadata', type: 'json', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ name: 'paid_at', type: 'datetime', nullable: true })
  paidAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

#### 3.2 Status Enum — `payment-order-status.enum.ts`

```typescript
export enum PaymentOrderStatus {
  CREATED  = 'CREATED',   // Order created, no payment initiated
  PENDING  = 'PENDING',   // Payment initiated with gateway
  PAID     = 'PAID',      // Payment confirmed via IPN
  FAILED   = 'FAILED',    // Payment failed
  CANCELED = 'CANCELED',  // Payment canceled by user
}
```

#### 3.3 Service — Key Methods

| Method            | Description                                                                 |
|-------------------|-----------------------------------------------------------------------------|
| `create(dto)`     | Creates a new order with status `CREATED`. Rejects duplicate `orderCode`.   |
| `findAll(query)`  | Paginated listing with filters (status, orderCode, customerId).             |
| `findByOrderCode` | Finds order by `orderCode`. Throws `NotFoundException` if not found.        |
| `updateStatus`    | Updates order status by ID.                                                 |
| `markAsPaid`      | **Atomic** update: sets status to `PAID` only if currently `CREATED`/`PENDING`. Returns `boolean` indicating success. |

The `markAsPaid` method uses a conditional WHERE clause to prevent race conditions:

```typescript
async markAsPaid(
  id: number,
  details: { provider: string; providerOrderId: string; paidAt: Date },
): Promise<boolean> {
  const result = await this.paymentOrderRepository.update(
    {
      id,
      status: In([PaymentOrderStatus.CREATED, PaymentOrderStatus.PENDING]),
    },
    {
      status: PaymentOrderStatus.PAID,
      provider: details.provider,
      providerOrderId: details.providerOrderId,
      paidAt: details.paidAt,
    },
  );
  return (result.affected ?? 0) > 0;
}
```

#### 3.4 Module — Export Service

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([PaymentOrder])],
  controllers: [PaymentOrderController],
  providers: [PaymentOrderService],
  exports: [PaymentOrderService],   // ← Exported so SepayModule can inject it
})
export class PaymentOrderModule {}
```

#### 3.5 REST Endpoints

| Method | Path              | Description                   |
|--------|-------------------|-------------------------------|
| POST   | `/payment-orders` | Create a new payment order    |
| GET    | `/payment-orders` | List orders with pagination   |

---

### Step 4: SePay Module

This module handles all SePay-specific logic: client initialization, payment initiation, and IPN processing.

#### 4.1 SePay Client Provider — `sepay-client.provider.ts`

Factory provider that creates and configures the `SePayPgClient` SDK instance:

```typescript
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SePayPgClient } from 'sepay-pg-node';

export const SEPAY_CLIENT = 'SEPAY_CLIENT';

export const SepayClientProvider: Provider = {
  provide: SEPAY_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService): SePayPgClient => {
    const env = configService.get<'sandbox' | 'production'>('sepay.env');
    const merchant_id = configService.get<string>('sepay.merchantId');
    const secret_key = configService.get<string>('sepay.secretKey');

    if (!merchant_id || !secret_key) {
      throw new Error(
        'SePay configuration is incomplete. SEPAY_MERCHANT_ID and SEPAY_SECRET_KEY must be set.',
      );
    }

    return new SePayPgClient({ env, merchant_id, secret_key });
  },
};
```

#### 4.2 SePay Service — `sepay.service.ts`

**`initPayment(orderCode, dto)`** — Initialize SePay checkout:

1. Finds the payment order by `orderCode`
2. Validates the order is in a payable state (not `PAID` or `CANCELED`)
3. Calls `sepayClient.checkout.initOneTimePaymentFields()` to generate form fields
4. Gets the checkout URL from `sepayClient.checkout.initCheckoutUrl()`
5. Transitions order status from `CREATED` → `PENDING`
6. Returns `checkoutUrl` and `formFields` to the client

```typescript
async initPayment(orderCode: string, dto: InitSepayPaymentDto) {
  const order = await this.paymentOrderService.findByOrderCode(orderCode);

  if (NON_PAYABLE_STATUSES.includes(order.status)) {
    throw new ConflictException(
      `Payment order is already ${order.status} and cannot be re-initiated`,
    );
  }

  const baseUrl = this.configService.get<string>('sepay.appPublicBaseUrl');

  const formFields = this.sepayClient.checkout.initOneTimePaymentFields({
    operation: 'PURCHASE',
    payment_method: dto.paymentMethod ?? 'BANK_TRANSFER',
    order_invoice_number: order.orderCode,
    order_amount: parseFloat(order.amount),
    currency: order.currency,
    order_description: order.description ?? `Payment for order ${order.orderCode}`,
    customer_id: order.customerId ?? undefined,
    success_url: `${baseUrl}/payments/sepay/success?orderCode=${order.orderCode}&amount=${order.amount}&status=PAID`,
    error_url: `${baseUrl}/payments/sepay/failed?orderCode=${order.orderCode}&amount=${order.amount}&status=FAILED`,
    cancel_url: `${baseUrl}/payments/sepay/canceled?orderCode=${order.orderCode}&amount=${order.amount}&status=CANCELED`,
    custom_data: JSON.stringify({
      internalOrderId: order.id,
      orderCode: order.orderCode,
    }),
  });

  const checkoutUrl = this.sepayClient.checkout.initCheckoutUrl();

  if (order.status === PaymentOrderStatus.CREATED) {
    await this.paymentOrderService.updateStatus(order.id, PaymentOrderStatus.PENDING);
  }

  return new SingleResponseDto({ orderCode: order.orderCode, checkoutUrl, formFields });
}
```

**Key mapping:** `order_invoice_number` in SePay maps to our `orderCode`. This is how IPN callbacks are matched back to our orders.

**`processIpn(payload)`** — Handle IPN webhook:

1. Extracts `order_invoice_number` from the IPN payload
2. Skips non-`ORDER_PAID` notification types
3. Finds the order by `orderCode` (= `order_invoice_number`)
4. Skips if order is already in a terminal state (`PAID`, `FAILED`, `CANCELED`)
5. Atomically marks the order as `PAID` using `markAsPaid()`
6. Always returns `{ success: true }` with HTTP 200 (required by SePay)

```typescript
async processIpn(payload: SepayIpnPayloadDto): Promise<IpnResult> {
  const invoiceNumber = payload.order.order_invoice_number;
  const transactionId = payload.transaction.transaction_id;

  if (payload.notification_type !== 'ORDER_PAID') {
    return { success: true };
  }

  let order;
  try {
    order = await this.paymentOrderService.findByOrderCode(invoiceNumber);
  } catch (error) {
    if (error instanceof NotFoundException) {
      return { success: true };   // Order not found — still return 200
    }
    throw error;
  }

  if (order.status === PaymentOrderStatus.PAID) {
    return { success: true };     // Already paid — idempotent
  }

  if ([PaymentOrderStatus.FAILED, PaymentOrderStatus.CANCELED].includes(order.status)) {
    return { success: true };     // Terminal state — skip
  }

  const paidAt = payload.transaction.transaction_date
    ? new Date(payload.transaction.transaction_date)
    : new Date();
  const safePaidAt = isNaN(paidAt.getTime()) ? new Date() : paidAt;

  await this.paymentOrderService.markAsPaid(order.id, {
    provider: 'sepay',
    providerOrderId: payload.transaction.id,
    paidAt: safePaidAt,
  });

  return { success: true };
}
```

#### 4.3 IPN Webhook Controller — `sepay-ipn.controller.ts`

Dedicated controller for the IPN endpoint:

```typescript
@Controller('payments/sepay')
export class SepayIpnController {
  constructor(private readonly sepayService: SepayService) {}

  @Post('ipn')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false,   // SePay may send extra fields
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }))
  processIpn(@Body() payload: SepayIpnPayloadDto) {
    return this.sepayService.processIpn(payload);
  }
}
```

> **Important:** The IPN controller uses `forbidNonWhitelisted: false` because SePay may include additional fields not defined in the DTO. The global `ValidationPipe` uses `forbidNonWhitelisted: true`, so the IPN controller overrides it locally.

#### 4.4 IPN Payload DTO — `sepay-ipn-payload.dto.ts`

Validates the incoming IPN webhook payload:

```typescript
export class SepayIpnPayloadDto {
  @IsInt()
  timestamp: number;

  @IsString()
  @IsNotEmpty()
  notification_type: string;          // e.g. "ORDER_PAID"

  @ValidateNested()
  @Type(() => SepayIpnOrderDto)
  order: SepayIpnOrderDto;            // Contains order_invoice_number

  @ValidateNested()
  @Type(() => SepayIpnTransactionDto)
  transaction: SepayIpnTransactionDto; // Contains transaction_id, transaction_date

  @IsOptional()
  customer?: any | null;

  @IsOptional()
  agreement?: any | null;
}
```

Key fields in nested objects:
- `order.order_invoice_number` → Maps to our `orderCode`
- `transaction.id` → Stored as `providerOrderId`
- `transaction.transaction_date` → Stored as `paidAt`

#### 4.5 Payment Controller — `sepay.controller.ts`

```typescript
@Controller('payment-orders')
export class SepayController {
  constructor(private readonly sepayService: SepayService) {}

  @Post(':orderCode/sepay/init')
  @HttpCode(HttpStatus.OK)
  initPayment(
    @Param('orderCode') orderCode: string,
    @Body() dto: InitSepayPaymentDto,
  ) {
    return this.sepayService.initPayment(orderCode, dto);
  }

  @Get(':orderCode/sepay/pay')
  @Header('Content-Type', 'text/html')
  getPayForm(@Param('orderCode') orderCode: string) {
    return this.sepayService.getPayFormHtml(orderCode);
  }
}
```

The `GET /payment-orders/:orderCode/sepay/pay` endpoint is a **debug helper** that returns an auto-submitting HTML form, useful for testing the full checkout flow in a browser without a frontend.

#### 4.6 API Key Guard — `sepay-api-key.guard.ts`

Protects the IPN endpoint using the `Authorization: Apikey <key>` header:

```typescript
@Injectable()
export class SepayApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Apikey ')) {
      throw new UnauthorizedException();
    }

    const providedKey = authHeader.slice('Apikey '.length);
    const expectedKey = this.configService.get<string>('sepay.webhookApiKey');

    // Timing-safe comparison to prevent timing attacks
    const providedBuf = Buffer.from(providedKey, 'utf8');
    const expectedBuf = Buffer.from(expectedKey, 'utf8');

    if (
      providedBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(providedBuf, expectedBuf)
    ) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
```

> **Note:** To enable the guard, add `@UseGuards(SepayApiKeyGuard)` to the IPN controller or endpoint. Configure the same API key in SePay dashboard under IPN settings.

#### 4.7 SePay Module — `sepay.module.ts`

```typescript
@Module({
  imports: [PaymentOrderModule],   // Import to access PaymentOrderService
  controllers: [SepayController, SepayIpnController],
  providers: [SepayService, SepayClientProvider],
})
export class SepayModule {}
```

---

### Step 5: Wire Everything in AppModule

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, sepayConfig],
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions =>
        configService.get<TypeOrmModuleOptions>('database'),
    }),
    PaymentOrderModule,
    SepayModule,
  ],
})
export class AppModule {}
```

---

### Step 6: Bootstrap the Application

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Sepay Integration API')
    .setDescription('PaymentOrder management — Sepay integration ready')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.APP_PORT ?? 3000;
  await app.listen(port);
}
bootstrap();
```

---

## 6. Payment Flow

### Complete Sequence Diagram

```
Client              NestJS App            Database            SePay Gateway
  │                     │                    │                     │
  │  1. POST /payment-orders               │                     │
  │  { orderCode, amount, ... }            │                     │
  │────────────────────▶│                    │                     │
  │                     │  2. INSERT order    │                     │
  │                     │  status=CREATED     │                     │
  │                     │───────────────────▶│                     │
  │                     │◀───────────────────│                     │
  │◀────────────────────│                    │                     │
  │  { data: order }    │                    │                     │
  │                     │                    │                     │
  │  3. POST /payment-orders/:orderCode/sepay/init               │
  │  { paymentMethod? }                     │                     │
  │────────────────────▶│                    │                     │
  │                     │  4. Generate form   │                     │
  │                     │  fields via SDK     │                     │
  │                     │────────────────────────────────────────▶│
  │                     │◀────────────────────────────────────────│
  │                     │  5. UPDATE status   │                     │
  │                     │  CREATED → PENDING  │                     │
  │                     │───────────────────▶│                     │
  │◀────────────────────│                    │                     │
  │  { checkoutUrl,     │                    │                     │
  │    formFields }     │                    │                     │
  │                     │                    │                     │
  │  6. POST to checkoutUrl with formFields (browser redirect)    │
  │──────────────────────────────────────────────────────────────▶│
  │                     │                    │                     │
  │  7. Customer completes payment on SePay page                  │
  │◀──────────────────────────────────────────────────────────────│
  │  (redirect to success_url / error_url / cancel_url)           │
  │                     │                    │                     │
  │                     │  8. SePay sends IPN │                     │
  │                     │  POST /payments/sepay/ipn               │
  │                     │◀────────────────────────────────────────│
  │                     │  { notification_type: "ORDER_PAID",     │
  │                     │    order: { order_invoice_number }, ... }│
  │                     │                    │                     │
  │                     │  9. Find order by   │                     │
  │                     │  order_invoice_number                    │
  │                     │───────────────────▶│                     │
  │                     │◀───────────────────│                     │
  │                     │                    │                     │
  │                     │  10. markAsPaid()   │                     │
  │                     │  (atomic update)    │                     │
  │                     │───────────────────▶│                     │
  │                     │◀───────────────────│                     │
  │                     │                    │                     │
  │                     │  11. Return 200     │                     │
  │                     │  { success: true }  │                     │
  │                     │────────────────────────────────────────▶│
```

### Step-by-Step Breakdown

| Step | Action | API / Method | Status Change |
|------|--------|-------------|---------------|
| 1 | Client creates a payment order | `POST /payment-orders` | → `CREATED` |
| 2 | Order saved to database | `PaymentOrderService.create()` | — |
| 3 | Client initiates SePay payment | `POST /payment-orders/:orderCode/sepay/init` | — |
| 4-5 | SDK generates checkout data, status updated | `SepayService.initPayment()` | `CREATED` → `PENDING` |
| 6 | Client submits form to SePay checkout URL | Browser form POST | — |
| 7 | Customer pays on SePay page | SePay hosted page | — |
| 8 | SePay sends IPN webhook | `POST /payments/sepay/ipn` | — |
| 9-10 | Find order, atomically mark as paid | `SepayService.processIpn()` | `PENDING` → `PAID` |
| 11 | Return HTTP 200 to SePay | IPN controller | — |

---

## 7. API Reference

### Payment Order APIs

#### Create Payment Order

```
POST /payment-orders
Content-Type: application/json
```

**Request Body:**
```json
{
  "orderCode": "PO_20260309_001",
  "amount": 100000,
  "currency": "VND",
  "customerId": "CUS_001",
  "description": "Test payment order",
  "metadata": { "source": "web" }
}
```

**Response (201):**
```json
{
  "data": {
    "id": 1,
    "orderCode": "PO_20260309_001",
    "provider": null,
    "providerOrderId": null,
    "amount": "100000.00",
    "currency": "VND",
    "status": "CREATED",
    "customerId": "CUS_001",
    "description": "Test payment order",
    "metadata": { "source": "web" },
    "paidAt": null,
    "createdAt": "2026-03-09T08:00:00.000Z",
    "updatedAt": "2026-03-09T08:00:00.000Z"
  }
}
```

#### List Payment Orders

```
GET /payment-orders?page=1&limit=20&status=CREATED&orderCode=PO_2026&customerId=CUS_001
```

**Response (200):**
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

### SePay Payment APIs

#### Initialize SePay Payment

```
POST /payment-orders/:orderCode/sepay/init
Content-Type: application/json
```

**Request Body:**
```json
{
  "paymentMethod": "BANK_TRANSFER"
}
```

Supported values: `BANK_TRANSFER` (VietQR), `NAPAS_BANK_TRANSFER`

**Response (200):**
```json
{
  "data": {
    "orderCode": "PO_20260309_001",
    "checkoutUrl": "https://pg.sepay.vn/checkout",
    "formFields": {
      "merchant_id": "...",
      "operation": "PURCHASE",
      "order_invoice_number": "PO_20260309_001",
      "order_amount": 100000,
      "currency": "VND",
      "...": "..."
    }
  }
}
```

#### Debug: Auto-Submit Pay Form

```
GET /payment-orders/:orderCode/sepay/pay
```

Returns an HTML page that automatically submits the payment form to SePay. **For development/testing only.**

### SePay IPN Webhook

```
POST /payments/sepay/ipn
Content-Type: application/json
Authorization: Apikey <your_webhook_api_key>
```

**Request Body (sent by SePay):**
```json
{
  "timestamp": 1759134682,
  "notification_type": "ORDER_PAID",
  "order": {
    "id": "e2c195be-c721-47eb-b323-99ab24e52d85",
    "order_id": "NQD-68DA43D73C1A5",
    "order_status": "CAPTURED",
    "order_currency": "VND",
    "order_amount": "100000.00",
    "order_invoice_number": "PO_20260309_001",
    "custom_data": [],
    "user_agent": "Mozilla/5.0",
    "ip_address": "14.186.39.212",
    "order_description": "Test payment"
  },
  "transaction": {
    "id": "384c66dd-41e6-4316-a544-b4141682595c",
    "payment_method": "BANK_TRANSFER",
    "transaction_id": "68da43da2d9de",
    "transaction_type": "PAYMENT",
    "transaction_date": "2025-09-29 15:31:22",
    "transaction_status": "APPROVED",
    "transaction_amount": "100000",
    "transaction_currency": "VND"
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

---

## 8. IPN Webhook Details

### How SePay IPN Works

1. After a customer completes payment, SePay sends a `POST` request to your configured IPN URL
2. The IPN payload contains `notification_type`, `order`, and `transaction` objects
3. Your server **must** return HTTP 200 to acknowledge receipt
4. If SePay does not receive HTTP 200, it will **retry** sending the IPN

### IPN Processing Logic

```
Receive IPN payload
        │
        ▼
Is notification_type === "ORDER_PAID"?
        │
   NO───┘───YES
   │         │
   ▼         ▼
 Return   Find order by order_invoice_number
 200           │
          NOT FOUND──────▶ Log warning, return 200
               │
          FOUND
               │
               ▼
          Is order already PAID?
               │
          YES──┘──NO
           │       │
           ▼       ▼
        Return   Is order FAILED or CANCELED?
        200           │
                 YES──┘──NO
                  │       │
                  ▼       ▼
               Return   markAsPaid() (atomic)
               200           │
                             ▼
                        Log result, return 200
```

### Key Design Decisions

- **Always return HTTP 200:** Even for errors/unknown orders. This prevents SePay from retrying endlessly.
- **Idempotent processing:** Duplicate IPN calls for the same order are safely ignored.
- **Atomic status update:** `markAsPaid()` uses a conditional WHERE clause (`status IN ('CREATED', 'PENDING')`) to prevent race conditions when multiple IPNs arrive simultaneously.

---

## 9. Status Transitions

```
  ┌──────────┐
  │ CREATED  │ ─── Payment order created by merchant
  └────┬─────┘
       │ initPayment()
       ▼
  ┌──────────┐
  │ PENDING  │ ─── Payment initiated with SePay
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
       └──── (future: user cancels) ──▶ ┌──────────┐
                                        │ CANCELED │
                                        └──────────┘
```

| From      | To        | Trigger                          |
|-----------|-----------|----------------------------------|
| `CREATED` | `PENDING` | `initPayment()` — first call     |
| `CREATED` | `PAID`    | `processIpn()` — direct IPN      |
| `PENDING` | `PAID`    | `processIpn()` — IPN after init  |
| `PENDING` | `FAILED`  | Future: failure notification      |
| `PENDING` | `CANCELED`| Future: cancellation              |

**Terminal states:** `PAID`, `FAILED`, `CANCELED` — no further transitions allowed.

---

## 10. Security Considerations

### 1. Webhook Authentication

The `SepayApiKeyGuard` validates the `Authorization: Apikey <key>` header on IPN requests using **timing-safe comparison** (`crypto.timingSafeEqual`) to prevent timing attacks.

To enable it, add the guard to the IPN controller:

```typescript
@UseGuards(SepayApiKeyGuard)
@Post('ipn')
processIpn(@Body() payload: SepayIpnPayloadDto) { ... }
```

### 2. HTTPS Requirement

SePay requires the IPN endpoint to use HTTPS. For local development, use a tunneling tool:

```bash
ngrok http 3000
```

Then set the ngrok HTTPS URL in SePay dashboard IPN configuration.

### 3. Input Validation

- All DTOs use `class-validator` decorators for strict input validation
- IPN controller uses `whitelist: true` to strip unknown properties
- `forbidNonWhitelisted: false` on IPN to tolerate extra fields from SePay

### 4. Atomic Status Updates

The `markAsPaid()` method uses conditional SQL UPDATE to prevent:
- Double-spending from duplicate IPNs
- Race conditions from concurrent webhook calls
- Invalid transitions from terminal states

---

## 11. Testing the Full Flow

### Local Development Setup

1. **Start infrastructure:**

```bash
docker compose up -d mysql
```

2. **Run migrations:**

```bash
npm run migration:run
```

3. **Seed test data (optional):**

```bash
mysql -u root -p sepay_integration < scripts/seed.sql
```

4. **Start the application:**

```bash
npm run start:dev
```

5. **Expose local server via ngrok:**

```bash
ngrok http 3000
```

6. **Configure IPN URL in SePay dashboard:**
   - URL: `https://<ngrok-id>.ngrok.io/payments/sepay/ipn`
   - API Key: same value as `SEPAY_WEBHOOK_API_KEY` in `.env`

### Test Scenario: Complete Payment

```bash
# Step 1: Create a payment order
curl -X POST http://localhost:3000/payment-orders \
  -H "Content-Type: application/json" \
  -d '{
    "orderCode": "TEST_001",
    "amount": 100000,
    "description": "Test payment"
  }'

# Step 2: Initialize SePay payment
curl -X POST http://localhost:3000/payment-orders/TEST_001/sepay/init \
  -H "Content-Type: application/json" \
  -d '{ "paymentMethod": "BANK_TRANSFER" }'

# Step 3: Open the pay form in browser (debug helper)
open http://localhost:3000/payment-orders/TEST_001/sepay/pay

# Step 4: Complete payment on SePay page
# → SePay will send IPN to your ngrok URL automatically

# Step 5: Verify order status
curl http://localhost:3000/payment-orders?orderCode=TEST_001
# → status should be "PAID"
```

### Simulate IPN Locally

For testing without SePay, you can send a mock IPN:

```bash
curl -X POST http://localhost:3000/payments/sepay/ipn \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": 1759134682,
    "notification_type": "ORDER_PAID",
    "order": {
      "id": "e2c195be-c721-47eb-b323-99ab24e52d85",
      "order_id": "NQD-68DA43D73C1A5",
      "order_status": "CAPTURED",
      "order_currency": "VND",
      "order_amount": "100000.00",
      "order_invoice_number": "TEST_001",
      "custom_data": [],
      "order_description": "Test payment"
    },
    "transaction": {
      "id": "384c66dd-41e6-4316-a544-b4141682595c",
      "payment_method": "BANK_TRANSFER",
      "transaction_id": "68da43da2d9de",
      "transaction_type": "PAYMENT",
      "transaction_date": "2026-03-12 15:31:22",
      "transaction_status": "APPROVED",
      "transaction_amount": "100000",
      "transaction_currency": "VND"
    },
    "customer": null,
    "agreement": null
  }'
```

### Swagger UI

Access the interactive API documentation at:

```
http://localhost:3000/docs
```

---

## 12. Docker Deployment

The project includes a `docker-compose.yaml` with three services:

| Service     | Description                          | Port Mapping |
|-------------|--------------------------------------|-------------|
| `mysql`     | MySQL 8.0 database                   | 3320:3306   |
| `migration` | Runs TypeORM migrations then exits   | —           |
| `app`       | NestJS application                   | 3020:3000   |

```bash
# Start everything (DB + migrations + app)
docker compose up -d

# View logs
docker compose logs -f app

# Rebuild after code changes
docker compose up -d --build app
```

The `migration` service runs `npm run migration:run` and exits. The `app` service waits for both MySQL health check and migration completion before starting.
