import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as ExcelJS from 'exceljs';
import { CampaignOrder, CampaignOrderDocument } from './schemas/campaign-order.schema';
import { Campaign, CampaignDocument } from './schemas/campaign.schema';
import { AthleteInfoDto, CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { CampaignOrderStatus } from './enums/campaign-order-status.enum';
import { SepayProvider } from '../payments/providers/sepay/sepay.provider';
import { SepayIpnPayloadDto } from './dto/sepay-ipn-payload.dto';
import { MailService } from '../mail/mail.service';
import { RabbitMQPublisherService } from '../rabbitmq/rabbitmq-publisher.service';
import { RoutingKey } from '../rabbitmq/constants/events';
import { OrderPaidPayload } from '../rabbitmq/dto/event-payloads';

@Injectable()
export class CampaignOrderService {
  private readonly logger = new Logger(CampaignOrderService.name);

  constructor(
    @InjectModel(CampaignOrder.name) private orderModel: Model<CampaignOrderDocument>,
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    private readonly sepayProvider: SepayProvider,
    private readonly mailService: MailService,
    private readonly rabbitMQPublisher: RabbitMQPublisherService,
  ) {}

  async create(campaignId: string, dto: CreateOrderDto): Promise<{ campaignId: Types.ObjectId; orderCode: string }> {
    const campaign = await this.campaignModel.findById(campaignId);
    if (!campaign) throw new NotFoundException('Campaign not found');

    const athletes: (AthleteInfoDto & { unitPrice: number })[] = [];
    let totalAmount = 0;

    for (const athlete of dto.athletes) {
      const distanceConfig = campaign.distances.find((d) => d.distance === athlete.distance);
      if (!distanceConfig) {
        throw new BadRequestException(`Cự ly ${athlete.distance}km không tồn tại trong campaign`);
      }

      const dob = new Date(athlete.dateOfBirth);
      const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 18 && !athlete.guardian) {
        throw new BadRequestException(
          `Vận động viên ${athlete.lastName} ${athlete.firstName} dưới 18 tuổi, cần cung cấp thông tin người giám hộ`,
        );
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { campaignId: new Types.ObjectId(campaignId) };
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

  async findPublicByOrderCode(orderCode: string): Promise<Pick<CampaignOrder, 'orderCode' | 'lastName' | 'firstName' | 'paymentStatus' | 'paymentId' | 'paidAt'>> {
    const order = await this.orderModel
      .findOne({ orderCode })
      .select('orderCode lastName firstName paymentStatus paymentId paidAt')
      .lean();
    if (!order) throw new NotFoundException('Order not found');
    return order as any;
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

      // Fire-and-forget: send email in background, status tracked in email_notifications collection
      this.sendOrderConfirmationEmail(order, payload.transaction.transaction_date, payload.transaction.payment_method);

      // Publish order.paid event to RabbitMQ for Telegram notification
      const campaign = await this.campaignModel.findById(order.campaignId);
      this.rabbitMQPublisher.publish<OrderPaidPayload>(RoutingKey.ORDER_PAID, {
        orderCode: order.orderCode,
        buyerName: `${order.lastName} ${order.firstName}`,
        buyerEmail: order.email,
        buyerPhone: order.phoneNumber,
        eventName: campaign?.name || '',
        totalAmount: order.finalAmount,
        athleteCount: order.athletes.length,
        paymentMethod: payload.transaction.payment_method || 'Bank Transfer',
        transactionId: payload.transaction.transaction_id,
        paidAt: payload.transaction.transaction_date || new Date().toISOString(),
      });
    }

    return { success: true };
  }

  async exportExcel(campaignId: string, fromDate: string, toDate: string): Promise<ExcelJS.Buffer> {
    const campaign = await this.campaignModel.findById(campaignId);
    if (!campaign) throw new NotFoundException('Campaign not found');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { campaignId: new Types.ObjectId(campaignId) };
    if (fromDate || toDate) {
      filter.orderDate = {};
      if (fromDate) filter.orderDate.$gte = new Date(fromDate);
      if (toDate) filter.orderDate.$lte = new Date(toDate);
    }

    const orders = await this.orderModel.find(filter).sort({ orderDate: -1 }).lean();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Orders');

    sheet.columns = [
      { header: 'STT', key: 'stt', width: 6 },
      { header: 'ID', key: 'id', width: 26 },
      { header: 'Tên sự kiện', key: 'eventName', width: 30 },
      { header: 'Mã đơn hàng', key: 'orderCode', width: 18 },
      { header: 'Họ và tên người mua', key: 'buyerName', width: 25 },
      { header: 'Email người mua', key: 'buyerEmail', width: 25 },
      { header: 'Số Điện thoại người mua', key: 'buyerPhone', width: 20 },
      { header: 'Thời gian xử lý', key: 'processedAt', width: 20 },
      { header: 'Payment Ref', key: 'paymentRef', width: 20 },
      { header: 'Đơn giá', key: 'unitPrice', width: 12 },
      { header: 'Số lượng', key: 'quantity', width: 10 },
      { header: 'Tổng tiền cuối', key: 'finalAmount', width: 15 },
      { header: 'Cung đường', key: 'distance', width: 12 },
      { header: 'Họ và tên', key: 'fullName', width: 25 },
      { header: 'Họ', key: 'lastName', width: 15 },
      { header: 'Tên', key: 'firstName', width: 15 },
      { header: 'Ngày sinh', key: 'dateOfBirth', width: 15 },
      { header: 'Giới tính', key: 'gender', width: 10 },
      { header: 'CCCD/ Hộ chiếu', key: 'identityCard', width: 18 },
      { header: 'Quốc tịch', key: 'national', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Địa chỉ', key: 'location', width: 30 },
      { header: 'Số điện thoại', key: 'phoneNumber', width: 18 },
      { header: 'Số điện thoại khẩn cấp', key: 'emergencyPhone', width: 20 },
      { header: 'Câu lạc bộ', key: 'club', width: 15 },
      { header: 'Trạng thái sức khỏe', key: 'medicalInfo', width: 20 },
      { header: 'Size áo', key: 'sizeShirt', width: 10 },
      { header: 'Loại thuốc đang dùng', key: 'typeOfMedicine', width: 20 },
      { header: 'Nhóm máu', key: 'bloodType', width: 10 },
      { header: 'Tên trên BIB', key: 'nameInBib', width: 18 },
      { header: 'Tên người giám hộ (nếu có)', key: 'guardianName', width: 25 },
      { header: 'Email người giám hộ (nếu có)', key: 'guardianEmail', width: 25 },
      { header: 'CCCD người giám hộ (nếu có)', key: 'guardianIdentityCard', width: 20 },
      { header: 'Ngày sinh người giám hộ (nếu có)', key: 'guardianDob', width: 20 },
      { header: 'SĐT người giám hộ (nếu có)', key: 'guardianPhone', width: 20 },
      { header: 'Mối quan hệ với người giám hộ (nếu có)', key: 'guardianRelationship', width: 20 },
      { header: 'Trạng thái vé', key: 'ticketStatus', width: 15 },
      { header: 'Trạng thái VĐV', key: 'athleteStatus', width: 15 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center' };

    let stt = 0;
    for (const order of orders) {
      for (const athlete of order.athletes) {
        stt++;
        const guardian = (athlete as any).guardian;
        sheet.addRow({
          stt,
          id: (order as any)._id?.toString(),
          eventName: campaign.name,
          orderCode: order.orderCode,
          buyerName: `${order.lastName} ${order.firstName}`,
          buyerEmail: order.email,
          buyerPhone: order.phoneNumber,
          processedAt: order.paidAt ? new Date(order.paidAt).toLocaleString('vi-VN') : '',
          paymentRef: order.providerTransactionId || '',
          unitPrice: (athlete as any).unitPrice,
          quantity: order.athletes.length,
          finalAmount: order.finalAmount,
          distance: athlete.distance,
          fullName: `${athlete.lastName} ${athlete.firstName}`,
          lastName: athlete.lastName,
          firstName: athlete.firstName,
          dateOfBirth: athlete.dateOfBirth ? new Date(athlete.dateOfBirth).toLocaleDateString('vi-VN') : '',
          gender: athlete.gender,
          identityCard: athlete.identityCard,
          national: athlete.national,
          email: athlete.email,
          location: athlete.location,
          phoneNumber: athlete.phoneNumber,
          emergencyPhone: athlete.medicalInformationPhoneNumber || '',
          club: athlete.club || '',
          medicalInfo: athlete.medicalInformation || '',
          sizeShirt: athlete.sizeShirt || '',
          typeOfMedicine: athlete.typeOfMedicine || '',
          bloodType: athlete.bloodType || '',
          nameInBib: athlete.nameInBib,
          guardianName: guardian?.fullName || '',
          guardianEmail: guardian?.email || '',
          guardianIdentityCard: guardian?.identityCard || '',
          guardianDob: guardian?.dateOfBirth ? new Date(guardian.dateOfBirth).toLocaleDateString('vi-VN') : '',
          guardianPhone: guardian?.phoneNumber || '',
          guardianRelationship: guardian?.relationship || '',
          ticketStatus: order.paymentStatus,
          athleteStatus: '',
        });
      }
    }

    return workbook.xlsx.writeBuffer();
  }

  async resendOrderConfirmationEmail(campaignId: string, orderCode: string): Promise<{ success: true }> {
    const order = await this.orderModel.findOne({
      orderCode,
      campaignId: new Types.ObjectId(campaignId),
    });
    if (!order) throw new NotFoundException('Order not found');

    if (order.paymentStatus !== CampaignOrderStatus.PAID) {
      throw new BadRequestException('Only paid orders can receive confirmation emails');
    }

    await this.sendOrderConfirmationEmail(
      order,
      order.paidAt?.toISOString(),
      (order.paymentMetadata as any)?.paymentMethod,
    );

    return { success: true };
  }

  private async sendOrderConfirmationEmail(
    order: CampaignOrderDocument,
    transactionDate?: string,
    paymentMethod?: string,
  ) {
    try {
      const campaign = await this.campaignModel.findById(order.campaignId);
      const paidAt = transactionDate ? new Date(transactionDate) : new Date();

      await this.mailService.sendGroupOrderConfirmation({
        toEmail: order.email,
        username: `${order.lastName} ${order.firstName}`,
        orderCode: order.orderCode,
        eventName: campaign?.name || '',
        groupName: campaign?.groupName || '',
        ticketNumber: order.athletes.length,
        processDate: paidAt.toLocaleDateString('vi-VN'),
        totalPrice: order.finalAmount.toLocaleString('vi-VN') + ' VND',
        paymentMethod: paymentMethod || 'Bank Transfer',
        endUserEmail: order.email,
        phone: order.phoneNumber,
        athletes: order.athletes.map((a) => ({
          name: `${a.lastName} ${a.firstName}`,
          distance: a.distance,
          email: a.email,
        })),
      });
    } catch (error) {
      this.logger.error(`Failed to send confirmation email for order ${order.orderCode}`, error);
    }
  }

  private generateOrderCode(): string {
    const isDev = process.env.NODE_ENV !== 'production';
    const prefix = isDev ? '5SPORTDEV' : '5SPORT';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }
}
