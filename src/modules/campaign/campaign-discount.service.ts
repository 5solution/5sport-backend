import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CampaignDiscount, CampaignDiscountDocument } from './schemas/campaign-discount.schema';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { ValidateDiscountDto } from './dto/validate-discount.dto';
import { DiscountType } from './enums/discount-type.enum';

@Injectable()
export class CampaignDiscountService {
  constructor(
    @InjectModel(CampaignDiscount.name) private discountModel: Model<CampaignDiscountDocument>,
  ) {}

  async create(campaignId: string, dto: CreateDiscountDto): Promise<CampaignDiscountDocument> {
    const existing = await this.discountModel.findOne({ code: dto.code.toUpperCase() });
    if (existing) throw new BadRequestException('Discount code already exists');
    const discount = new this.discountModel({
      ...dto,
      code: dto.code.toUpperCase(),
      campaignId: new Types.ObjectId(campaignId),
    });
    return discount.save();
  }

  async findAll(campaignId: string): Promise<CampaignDiscountDocument[]> {
    return this.discountModel.find({ campaignId: new Types.ObjectId(campaignId) }).sort({ createdAt: -1 });
  }

  async update(campaignId: string, id: string, dto: UpdateDiscountDto): Promise<CampaignDiscountDocument> {
    const discount = await this.findOrFail(campaignId, id);
    Object.assign(discount, dto);
    return discount.save();
  }

  async remove(campaignId: string, id: string): Promise<void> {
    const discount = await this.findOrFail(campaignId, id);
    await discount.deleteOne();
  }

  async validate(campaignId: string, dto: ValidateDiscountDto): Promise<{ discount: CampaignDiscountDocument; discountAmount: number }> {
    const now = new Date();
    const discount = await this.discountModel.findOne({
      campaignId: new Types.ObjectId(campaignId),
      code: dto.code.toUpperCase(),
      isActive: true,
      startTime: { $lte: now },
      endTime: { $gte: now },
    });
    if (!discount) throw new BadRequestException('Invalid or expired discount code');
    if (discount.maxUses != null && discount.usedCount >= discount.maxUses) {
      throw new BadRequestException('Discount code has reached maximum uses');
    }
    if (discount.minOrderAmount != null && dto.totalAmount < discount.minOrderAmount) {
      throw new BadRequestException(`Minimum order amount is ${discount.minOrderAmount}`);
    }
    let discountAmount = 0;
    if (discount.discountType === DiscountType.PERCENTAGE) {
      discountAmount = (dto.totalAmount * discount.discountValue) / 100;
    } else {
      discountAmount = discount.discountValue;
    }
    discountAmount = Math.min(discountAmount, dto.totalAmount);
    return { discount, discountAmount };
  }

  async incrementUsedCount(id: Types.ObjectId): Promise<void> {
    await this.discountModel.findByIdAndUpdate(id, { $inc: { usedCount: 1 } });
  }

  private async findOrFail(campaignId: string, id: string): Promise<CampaignDiscountDocument> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Discount not found');
    const discount = await this.discountModel.findOne({
      _id: new Types.ObjectId(id),
      campaignId: new Types.ObjectId(campaignId),
    });
    if (!discount) throw new NotFoundException('Discount not found');
    return discount;
  }
}
