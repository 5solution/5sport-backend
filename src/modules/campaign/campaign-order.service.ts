import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CampaignOrder, CampaignOrderDocument } from './schemas/campaign-order.schema';
import { Campaign, CampaignDocument } from './schemas/campaign.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { CampaignOrderStatus } from './enums/campaign-order-status.enum';
import { SepayProvider } from '../payments/providers/sepay/sepay.provider';
import { SepayIpnPayloadDto } from './dto/sepay-ipn-payload.dto';

@Injectable()
export class CampaignOrderService {
  private readonly logger = new Logger(CampaignOrderService.name);

  constructor(
    @InjectModel(CampaignOrder.name) private orderModel: Model<CampaignOrderDocument>,
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    private readonly sepayProvider: SepayProvider,
  ) {}

  async create(campaignId: string, dto: CreateOrderDto): Promise<{ campaignId: any; orderCode: string }> {
    const campaign = await this.campaignModel.findById(campaignId);
    if (!campaign) throw new NotFoundException('Campaign not found');

    const athletes: any[] = [];
    let totalAmount = 0;

    for (const athlete of dto.athletes) {
      const distanceConfig = campaign.distances.find((d) => d.distance === athlete.distance);
      if (!distanceConfig) {
        throw new BadRequestException(`Cự ly ${athlete.distance}km không tồn tại trong campaign`);
      }
      const unitPrice = distanceConfig.price;
      totalAmount += unitPrice;
      athletes.push({
        ...athlete,
        unitPrice,
      });
    }

    const order = new this.orderModel({
      campaignId: new Types.ObjectId(campaignId),
      orderCode: this.generateOrderCode(),
      lastName: dto.lastName,
      firstName: dto.firstName,
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      totalAmount,
      discountAmount: 0,
      finalAmount: totalAmount,
      athletes,
      orderDate: new Date(),
    });

    const saved = await order.save();
    return {
      campaignId: saved.campaignId,
      orderCode: saved.orderCode,
    };
  }

  async findAll(campaignId: string, query: OrderQueryDto): Promise<{ data: CampaignOrderDocument[]; total: number }> {
    const filter: any = { campaignId: new Types.ObjectId(campaignId) };
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
    if (query.fromDate || query.toDate) {
      filter.orderDate = {};
      if (query.fromDate) filter.orderDate.$gte = new Date(query.fromDate);
      if (query.toDate) filter.orderDate.$lte = new Date(query.toDate);
    }
    if (query.distance) {
      filter['athletes.distance'] = query.distance;
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.orderModel.find(filter).sort({ orderDate: -1 }).skip(skip).limit(limit),
      this.orderModel.countDocuments(filter),
    ]);

    return { data, total };
  }

  async findById(campaignId: string, id: string): Promise<CampaignOrderDocument> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Order not found');
    const order = await this.orderModel.findOne({
      _id: new Types.ObjectId(id),
      campaignId: new Types.ObjectId(campaignId),
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findByOrderCode(orderCode: string): Promise<CampaignOrderDocument> {
    const order = await this.orderModel.findOne({ orderCode });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async initSepayPayment(campaignId: string, orderCode: string): Promise<{
    orderCode: string;
    checkoutUrl: string;
    formFields: Record<string, any>;
  }> {
    const order = await this.orderModel.findOne({
      orderCode,
      campaignId: new Types.ObjectId(campaignId),
    });
    if (!order) throw new NotFoundException('Order not found');

    if (order.paymentStatus === CampaignOrderStatus.PAID) {
      throw new ConflictException('Order is already paid');
    }
    if (order.paymentStatus === CampaignOrderStatus.REFUNDED) {
      throw new ConflictException('Order has been refunded');
    }

    const paymentResponse = await this.sepayProvider.createPayment({
      amount: order.finalAmount,
      orderId: order.orderCode,
      description: `Payment for order ${order.orderCode}`,
      returnUrl: '',
      callbackUrl: '',
      ipAddr: '127.0.0.1',
      paymentMethod: 'SEPAY_BANK_TRANSFER',
    });

    order.paymentProvider = 'sepay';
    order.paymentStatus = CampaignOrderStatus.PENDING;
    await order.save();

    return {
      orderCode: order.orderCode,
      checkoutUrl: paymentResponse.paymentUrl,
      formFields: (paymentResponse as any).formFields,
    };
  }

  async processSepayIpn(payload: SepayIpnPayloadDto): Promise<{ success: true }> {
    if (payload.notification_type !== 'ORDER_PAID') {
      return { success: true };
    }

    const invoiceNumber = payload.order.order_invoice_number;
    const order = await this.orderModel.findOne({ orderCode: invoiceNumber });
    if (!order) {
      return { success: true };
    }

    const terminalStatuses = [CampaignOrderStatus.PAID, CampaignOrderStatus.FAILED, CampaignOrderStatus.REFUNDED];
    if (terminalStatuses.includes(order.paymentStatus)) {
      return { success: true };
    }

    const result = await this.orderModel.updateOne(
      { _id: order._id, paymentStatus: CampaignOrderStatus.PENDING },
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
      this.logger.log(`Order ${invoiceNumber} marked as PAID via SePay IPN`);
    }

    return { success: true };
  }

  private generateOrderCode(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }
}
