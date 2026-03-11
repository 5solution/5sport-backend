import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CampaignOrder, CampaignOrderDocument } from './schemas/campaign-order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { CampaignProductService } from './campaign-product.service';

@Injectable()
export class CampaignOrderService {
  constructor(
    @InjectModel(CampaignOrder.name) private orderModel: Model<CampaignOrderDocument>,
    private productService: CampaignProductService,
  ) {}

  async create(campaignId: string, dto: CreateOrderDto): Promise<CampaignOrderDocument> {
    const items: any[] = [];
    let totalAmount = 0;

    for (const item of dto.items) {
      const product = await this.productService.findProductOrFail(campaignId, item.productId);
      const unitPrice = await this.productService.getCurrentPrice(item.productId);
      totalAmount += unitPrice * item.athletes.length;
      items.push({
        productId: new Types.ObjectId(item.productId),
        productName: product.name,
        unitPrice,
        athletes: item.athletes,
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
      items,
      orderDate: new Date(),
    });

    return order.save();
  }

  async findAll(campaignId: string, query: OrderQueryDto): Promise<{ data: CampaignOrderDocument[]; total: number }> {
    const filter: any = { campaignId: new Types.ObjectId(campaignId) };
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
    if (query.fromDate || query.toDate) {
      filter.orderDate = {};
      if (query.fromDate) filter.orderDate.$gte = new Date(query.fromDate);
      if (query.toDate) filter.orderDate.$lte = new Date(query.toDate);
    }
    if (query.productId) {
      filter['items.productId'] = new Types.ObjectId(query.productId);
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

  private generateOrderCode(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }
}
