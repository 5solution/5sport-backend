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
import { EventSession } from './entities/event-session.entity';
import { EventParticipant, ParticipantStatus } from './entities/event-participant.entity';
import { Athlete } from '../athlete/entities/athlete.entity';
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
    @InjectRepository(EventSession)
    private readonly sessionRepo: Repository<EventSession>,
    @InjectRepository(EventParticipant)
    private readonly participantRepo: Repository<EventParticipant>,
    @InjectRepository(Athlete)
    private readonly athleteRepo: Repository<Athlete>,
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

    // Free orders are PAID immediately → create participants
    if (finalAmount === 0) {
      try {
        await this.createParticipantsFromOrder(order);
      } catch (err) {
        this.logger.error(`Failed to create participants for free order ${orderCode}`, err);
      }
    }

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

    // Sync payment status if order is still pending
    if (order.paymentStatus === EventOrderStatus.PENDING) {
      try {
        const payment = await this.paymentsService.getPaymentByOrderId(orderCode);

        // If local payment record is also pending, try inquiry from provider
        if (payment.status === PaymentTransactionStatus.PENDING) {
          try {
            const inquiry = await this.paymentsService.inquirePayment(orderCode);
            payment.status = inquiry.status;
            if (inquiry.status === PaymentTransactionStatus.SUCCESS) {
              payment.paymentDate = new Date();
            }
          } catch {
            // Inquiry not supported or failed, continue with local status
          }
        }

        if (payment.status === PaymentTransactionStatus.SUCCESS) {
          order.paymentStatus = EventOrderStatus.PAID;
          order.paidAt = payment.paymentDate || new Date();
          order.providerTransactionId = payment.paymentId;
          await this.orderRepo.save(order);

          // Create participants after payment success
          try {
            await this.createParticipantsFromOrder(order);
          } catch (err) {
            this.logger.error(`Failed to create participants for order ${orderCode}`, err);
          }
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

    // Create participants when payment is confirmed via callback
    if (status === EventOrderStatus.PAID) {
      try {
        await this.createParticipantsFromOrder(order);
      } catch (err) {
        this.logger.error(`Failed to create participants for order ${orderCode}`, err);
      }
    }
  }

  /**
   * After payment confirmed, create EventParticipant for each athlete in the order.
   * - Singles session → status PAIRED (ready to play)
   * - Doubles session (requirePartner) → status FINDING_PARTNER (waiting for pairing)
   */
  async createParticipantsFromOrder(order: EventOrder) {
    // Get event to determine sportType
    const event = await this.eventRepo.findOne({ where: { id: order.eventId } });
    if (!event) {
      this.logger.warn(`Event ${order.eventId} not found, skipping participant creation`);
      return;
    }

    for (const athleteInfo of order.athletes) {
      // Find existing athlete by userId+sportType or by phone+sportType
      let athlete = order.userId
        ? await this.athleteRepo.findOne({
            where: { userId: order.userId, sportType: event.sportType },
          })
        : null;

      if (!athlete) {
        athlete = await this.athleteRepo.findOne({
          where: { phoneNumber: athleteInfo.phone, sportType: event.sportType },
        });
      }

      if (!athlete) {
        // Cannot create athlete without userId
        if (!order.userId) {
          this.logger.warn(
            `Cannot create athlete for ${athleteInfo.fullName} — order has no userId. Skipping.`,
          );
          continue;
        }

        athlete = this.athleteRepo.create({
          userId: order.userId,
          name: athleteInfo.fullName,
          sportType: event.sportType,
          phoneNumber: athleteInfo.phone,
          dateOfBirth: athleteInfo.dateOfBirth
            ? new Date(athleteInfo.dateOfBirth)
            : null,
          gender: athleteInfo.gender || null,
          isActive: true,
        });
        athlete = await this.athleteRepo.save(athlete);
        this.logger.log(`Created athlete ${athlete.id} for ${athleteInfo.fullName}`);
      }

      // Get session from ticket tier
      const tier = await this.ticketTierRepo.findOne({
        where: { id: athleteInfo.ticketTierId },
      });
      if (!tier) {
        this.logger.warn(`TicketTier ${athleteInfo.ticketTierId} not found, skipping participant creation`);
        continue;
      }

      const session = await this.sessionRepo.findOne({
        where: { id: tier.sessionId },
      });

      // Check if already registered (prevent duplicates)
      const existing = await this.participantRepo.findOne({
        where: { eventId: order.eventId, athleteId: athlete.id },
      });
      if (existing) {
        this.logger.log(`Athlete ${athlete.id} already registered for event ${order.eventId}, skipping`);
        continue;
      }

      // Generate ticket code
      const count = await this.participantRepo.count({
        where: { eventId: order.eventId },
      });
      const ticketCode = `TKT-${String(count + 1).padStart(4, '0')}`;

      // Determine status based on session type
      const status = session?.requirePartner
        ? ParticipantStatus.FINDING_PARTNER
        : ParticipantStatus.PAIRED;

      const participant = this.participantRepo.create({
        eventId: order.eventId,
        sessionId: tier.sessionId,
        athleteId: athlete.id,
        userId: order.userId,
        ticketCode,
        registrationDate: new Date(),
        status,
      });

      await this.participantRepo.save(participant);
      this.logger.log(
        `Created participant ${participant.id} (${athleteInfo.fullName}) with status ${status}`,
      );
    }
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

  async findAllOrders(filters: {
    page?: number;
    limit?: number;
    status?: string;
    eventId?: string;
    search?: string;
  }): Promise<{ data: any[]; total: number }> {
    const { page = 1, limit = 20, status, eventId, search } = filters;

    const qb = this.orderRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.event', 'event')
      .orderBy('o.orderDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) {
      qb.andWhere('o.paymentStatus = :status', { status });
    }

    if (eventId) {
      qb.andWhere('o.eventId = :eventId', { eventId });
    }

    if (search) {
      qb.andWhere(
        '(o.orderCode ILIKE :search OR o.contactName ILIKE :search OR o.contactEmail ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((o) => ({
        ...o,
        eventName: (o as any).event?.name || null,
        eventSlug: (o as any).event?.slug || null,
        eventBrand: (o as any).event?.brand || null,
        event: undefined,
      })),
      total,
    };
  }

  private generateOrderCode(): string {
    const isDev = process.env.NODE_ENV !== 'production';
    const prefix = isDev ? '5SPORT-DEV' : '5SPORT';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }
}
