import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventOrder, EventOrderStatus, OrderAthleteInfo } from './entities/event-order.entity';
import { Event } from './entities/event.entity';
import { TicketTier } from './entities/ticket-tier.entity';
import { CreateEventOrderDto } from './dto/create-event-order.dto';
import { PaymentsService } from '../payments/payments.service';
import { PaymentTransactionStatus } from '../payments/interfaces/payment-provider.interface';
import { PaymentMethod } from './enums/payment-method.enum';

@Injectable()
export class EventOrderService {
  private readonly logger = new Logger(EventOrderService.name);

  constructor(
    @InjectRepository(EventOrder)
    private readonly orderRepo: Repository<EventOrder>,
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    @InjectRepository(TicketTier)
    private readonly ticketTierRepo: Repository<TicketTier>,
    private readonly paymentsService: PaymentsService,
  ) {}

  async create(
    eventId: string,
    dto: CreateEventOrderDto,
    userId?: string,
  ): Promise<{ orderCode: string; totalAmount: number; finalAmount: number }> {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const athletes: OrderAthleteInfo[] = [];
    let totalAmount = 0;

    for (const athlete of dto.athletes) {
      const tier = await this.ticketTierRepo.findOne({
        where: { id: athlete.ticketTierId },
      });

      if (!tier) {
        throw new BadRequestException(
          `Ticket tier ${athlete.ticketTierId} not found`,
        );
      }

      const unitPrice = tier.isFree ? 0 : Number(tier.price || 0);
      totalAmount += unitPrice;

      athletes.push({
        fullName: athlete.fullName,
        email: athlete.email,
        phone: athlete.phone,
        dateOfBirth: athlete.dateOfBirth,
        gender: athlete.gender,
        idNumber: athlete.idNumber,
        ticketTierId: athlete.ticketTierId,
        ticketTierName: tier.name,
        unitPrice,
      });
    }

    const orderCode = this.generateOrderCode();
    const finalAmount = totalAmount;

    const order = this.orderRepo.create({
      eventId,
      userId: userId || null,
      orderCode,
      contactName: dto.contactName,
      contactEmail: dto.contactEmail,
      contactPhone: dto.contactPhone,
      athletes,
      totalAmount,
      discountCode: dto.discountCode || null,
      discountAmount: 0,
      finalAmount,
      paymentStatus: finalAmount === 0 ? EventOrderStatus.PAID : EventOrderStatus.PENDING,
      orderDate: new Date(),
    });

    await this.orderRepo.save(order);

    return { orderCode, totalAmount, finalAmount };
  }

  async initPayment(
    eventId: string,
    orderCode: string,
    paymentMethod: PaymentMethod,
    returnUrl: string,
    ipAddr: string,
  ) {
    const order = await this.orderRepo.findOne({
      where: { orderCode, eventId },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (order.paymentStatus === EventOrderStatus.PAID) {
      throw new ConflictException('Order is already paid');
    }

    if (order.finalAmount === 0) {
      throw new BadRequestException('Free orders do not need payment');
    }

    const callbackUrl = `${process.env.APP_PUBLIC_BASE_URL || 'http://localhost:3000'}/payments/${paymentMethod}/callback`;

    const paymentResult = await this.paymentsService.createPaymentUrl({
      amount: Number(order.finalAmount),
      orderId: order.orderCode,
      orderInfo: `Thanh toan don hang ${order.orderCode}`,
      ipAddr,
      returnUrl,
      callbackUrl,
      paymentMethod,
    });

    order.paymentMethod = paymentMethod;
    order.paymentProvider = paymentMethod;
    await this.orderRepo.save(order);

    return {
      orderCode: order.orderCode,
      ...paymentResult,
    };
  }

  async findByOrderCode(orderCode: string) {
    const order = await this.orderRepo.findOne({ where: { orderCode } });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findPublicByOrderCode(orderCode: string) {
    const order = await this.orderRepo.findOne({
      where: { orderCode },
    });
    if (!order) throw new NotFoundException('Order not found');

    // Sync payment status from Payment entity if order is still pending
    if (order.paymentStatus === EventOrderStatus.PENDING) {
      try {
        const payment = await this.paymentsService.getPaymentByOrderId(orderCode);
        if (payment.status === PaymentTransactionStatus.SUCCESS) {
          order.paymentStatus = EventOrderStatus.PAID;
          order.paidAt = payment.paymentDate || new Date();
          order.providerTransactionId = payment.paymentId;
          await this.orderRepo.save(order);
        } else if (payment.status === PaymentTransactionStatus.FAILED) {
          order.paymentStatus = EventOrderStatus.FAILED;
          await this.orderRepo.save(order);
        }
      } catch {
        // Payment record might not exist yet, ignore
      }
    }

    return {
      orderCode: order.orderCode,
      contactName: order.contactName,
      contactEmail: order.contactEmail,
      paymentStatus: order.paymentStatus,
      finalAmount: order.finalAmount,
      paidAt: order.paidAt,
      paymentMethod: order.paymentMethod,
    };
  }

  async updatePaymentStatus(
    orderCode: string,
    status: EventOrderStatus,
    metadata?: Record<string, any>,
  ) {
    const order = await this.orderRepo.findOne({ where: { orderCode } });
    if (!order) return;

    const terminalStatuses = [
      EventOrderStatus.PAID,
      EventOrderStatus.REFUNDED,
    ];
    if (terminalStatuses.includes(order.paymentStatus)) return;

    order.paymentStatus = status;
    if (metadata) {
      order.paymentMetadata = metadata;
      order.providerTransactionId = metadata.transactionId;
    }
    if (status === EventOrderStatus.PAID) {
      order.paidAt = new Date();
    }

    await this.orderRepo.save(order);
    this.logger.log(`Order ${orderCode} updated to ${status}`);
  }

  async findAllByEvent(
    eventId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: EventOrder[]; total: number }> {
    const [data, total] = await this.orderRepo.findAndCount({
      where: { eventId },
      order: { orderDate: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  private generateOrderCode(): string {
    const isDev = process.env.NODE_ENV !== 'production';
    const prefix = isDev ? 'EVTDEV' : 'EVT';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }
}
