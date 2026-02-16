import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { VnpayModule } from 'nestjs-vnpay';
import { consoleLogger, HashAlgorithm } from 'vnpay';
import { env } from 'src/config';

import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment } from './entities/payment.entity';
import { PaymentFactory } from './payment.factory';
import { VnpayProvider } from './providers/vnpay/vnpay.provider';
import { PayxProvider } from './providers/payx/payx.provider';
import { PayxConfig } from './providers/payx/payx.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    HttpModule,
    VnpayModule.register({
      tmnCode: env.vnpay.tmnCode,
      secureSecret: env.vnpay.hashSecretKey,
      vnpayHost: 'https://sandbox.vnpayment.vn',
      testMode: true,
      hashAlgorithm: HashAlgorithm.SHA512,
      enableLog: true,
      loggerFn: consoleLogger,
    }),
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentFactory,
    VnpayProvider,
    PayxProvider,
    PayxConfig,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
