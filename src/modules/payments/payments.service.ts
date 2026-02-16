import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Payment } from './entities/payment.entity';
import { PaymentFactory } from './payment.factory';
import { PaymentTransactionStatus } from './interfaces/payment-provider.interface';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly paymentFactory: PaymentFactory,
  ) {}

  async createPaymentUrl(createPaymentDto: CreatePaymentDto) {
    const { amount, orderId, orderInfo, ipAddr, returnUrl, paymentMethod, callbackUrl, displayMode } =
      createPaymentDto;

    // Get appropriate provider
    const provider = this.paymentFactory.getProvider(paymentMethod);

    // Create payment record
    const payment = this.paymentRepo.create({
      orderId,
      paymentMethod,
      providerName: provider.getProviderName(),
      amount,
      description: orderInfo,
      ipAddr,
      returnUrl: returnUrl || '',
      callbackUrl,
      status: PaymentTransactionStatus.PENDING,
      expireDate: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    await this.paymentRepo.save(payment);

    // Generate payment URL/info
    const paymentResponse = await provider.createPayment({
      amount,
      orderId,
      description: orderInfo,
      returnUrl: returnUrl || '',
      callbackUrl,
      ipAddr,
      paymentMethod: paymentMethod.toString(),
      displayMode,
    });

    // Update payment with provider's payment ID
    if (paymentResponse.paymentId) {
      payment.paymentId = paymentResponse.paymentId;
      await this.paymentRepo.save(payment);
    }

    return {
      ...paymentResponse,
      orderId,
      transactionId: payment.id,
    };
  }

  async handleCallback(paymentMethod: string, callbackData: any) {
    const provider = this.paymentFactory.getProvider(paymentMethod as any);

    // Verify callback
    const isValid = await provider.verifyCallback(callbackData);
    if (!isValid) {
      throw new BadRequestException('Invalid callback signature');
    }

    // Find payment transaction
    const payment = await this.paymentRepo.findOne({
      where: { orderId: callbackData.orderId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Update payment status
    payment.status = callbackData.status;
    payment.errorCode = callbackData.errorCode;
    payment.errorMessage = callbackData.errorMessage;

    if (callbackData.status === PaymentTransactionStatus.SUCCESS) {
      payment.paymentDate = new Date();
    }

    await this.paymentRepo.save(payment);

    return { success: true };
  }

  async verifyPaymentReturn(paymentMethod: string, queryParams: any) {
    const provider = this.paymentFactory.getProvider(paymentMethod as any);

    const result = await provider.verifyReturn(queryParams);

    // Update payment record
    const payment = await this.paymentRepo.findOne({
      where: { orderId: result.orderId },
    });

    if (payment) {
      payment.status = result.status;
      payment.errorCode = result.errorCode;
      payment.errorMessage = result.errorMessage;

      if (result.status === PaymentTransactionStatus.SUCCESS) {
        payment.paymentDate = new Date();
      }

      await this.paymentRepo.save(payment);
    }

    return result;
  }

  async inquirePayment(orderId: string) {
    const payment = await this.paymentRepo.findOne({ where: { orderId } });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const provider = this.paymentFactory.getProvider(payment.paymentMethod);

    const result = await provider.inquirePayment({ orderId });

    // Update local record
    payment.status = result.status;
    payment.errorCode = result.errorCode;
    payment.errorMessage = result.errorMessage;

    if (result.status === PaymentTransactionStatus.SUCCESS && !payment.paymentDate) {
      payment.paymentDate = new Date();
    }

    await this.paymentRepo.save(payment);

    return result;
  }

  async getPaymentByOrderId(orderId: string) {
    const payment = await this.paymentRepo.findOne({ where: { orderId } });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  findAll() {
    return this.paymentRepo.find();
  }

  findOne(id: string) {
    return this.paymentRepo.findOne({ where: { id } });
  }

  remove(id: string) {
    return this.paymentRepo.delete(id);
  }
}
