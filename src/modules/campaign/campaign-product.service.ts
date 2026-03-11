import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CampaignProduct, CampaignProductDocument } from './schemas/campaign-product.schema';
import { CampaignPricingPhase, CampaignPricingPhaseDocument } from './schemas/campaign-pricing-phase.schema';
import { CreateCampaignProductDto } from './dto/create-campaign-product.dto';
import { UpdateCampaignProductDto } from './dto/update-campaign-product.dto';
import { CreatePricingPhaseDto } from './dto/create-pricing-phase.dto';
import { UpdatePricingPhaseDto } from './dto/update-pricing-phase.dto';
import { CampaignService } from './campaign.service';

@Injectable()
export class CampaignProductService {
  constructor(
    @InjectModel(CampaignProduct.name) private productModel: Model<CampaignProductDocument>,
    @InjectModel(CampaignPricingPhase.name) private phaseModel: Model<CampaignPricingPhaseDocument>,
    private campaignService: CampaignService,
  ) {}

  async createProduct(campaignId: string, user: any, dto: CreateCampaignProductDto): Promise<CampaignProductDocument> {
    await this.campaignService.findById(campaignId);
    const product = new this.productModel({ ...dto, campaignId: new Types.ObjectId(campaignId) });
    return product.save();
  }

  async findProducts(campaignId: string) {
    const products = await this.productModel
      .find({ campaignId: new Types.ObjectId(campaignId) })
      .sort({ sortOrder: 1 });

    const now = new Date();
    const productIds = products.map((p) => p._id);

    const activePhases = await this.phaseModel
      .find({
        productId: { $in: productIds },
        startTime: { $lte: now },
        endTime: { $gte: now },
      })
      .sort({ sortOrder: 1 });

    // Map productId → first active phase (lowest sortOrder)
    const activePhaseMap = new Map<string, CampaignPricingPhaseDocument>();
    for (const phase of activePhases) {
      const key = phase.productId.toString();
      if (!activePhaseMap.has(key)) activePhaseMap.set(key, phase);
    }

    return products.map((product) => {
      const active = activePhaseMap.get(product._id.toString());
      return {
        ...product.toObject(),
        currentPrice: active ? active.price : product.originalPrice,
        activePhaseName: active ? active.name : null,
        activePhaseId: active ? active._id : null,
      };
    });
  }

  async updateProduct(campaignId: string, productId: string, user: any, dto: UpdateCampaignProductDto): Promise<CampaignProductDocument> {
    const product = await this.findProductOrFail(campaignId, productId);
    Object.assign(product, dto);
    return product.save();
  }

  async removeProduct(campaignId: string, productId: string, user: any): Promise<void> {
    const product = await this.findProductOrFail(campaignId, productId);
    await product.deleteOne();
  }

  async createPhase(campaignId: string, productId: string, dto: CreatePricingPhaseDto): Promise<CampaignPricingPhaseDocument> {
    await this.findProductOrFail(campaignId, productId);
    const phase = new this.phaseModel({ ...dto, productId: new Types.ObjectId(productId) });
    return phase.save();
  }

  async findPhases(campaignId: string, productId: string): Promise<CampaignPricingPhaseDocument[]> {
    await this.findProductOrFail(campaignId, productId);
    return this.phaseModel.find({ productId: new Types.ObjectId(productId) }).sort({ sortOrder: 1 });
  }

  async updatePhase(campaignId: string, productId: string, phaseId: string, dto: UpdatePricingPhaseDto): Promise<CampaignPricingPhaseDocument> {
    const phase = await this.findPhaseOrFail(productId, phaseId);
    Object.assign(phase, dto);
    return phase.save();
  }

  async removePhase(campaignId: string, productId: string, phaseId: string): Promise<void> {
    const phase = await this.findPhaseOrFail(productId, phaseId);
    await phase.deleteOne();
  }

  async getCurrentPrice(productId: string): Promise<number> {
    const product = await this.productModel.findById(productId);
    if (!product) throw new NotFoundException('Product not found');
    const now = new Date();
    const phases = await this.phaseModel.find({
      productId: new Types.ObjectId(productId),
      startTime: { $lte: now },
      endTime: { $gte: now },
    }).sort({ sortOrder: 1 });
    return phases.length > 0 ? phases[0].price : product.originalPrice;
  }

  async findProductOrFail(campaignId: string, productId: string): Promise<CampaignProductDocument> {
    if (!Types.ObjectId.isValid(productId)) throw new NotFoundException('Product not found');
    const product = await this.productModel.findOne({
      _id: new Types.ObjectId(productId),
      campaignId: new Types.ObjectId(campaignId),
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  private async findPhaseOrFail(productId: string, phaseId: string): Promise<CampaignPricingPhaseDocument> {
    if (!Types.ObjectId.isValid(phaseId)) throw new NotFoundException('Phase not found');
    const phase = await this.phaseModel.findOne({
      _id: new Types.ObjectId(phaseId),
      productId: new Types.ObjectId(productId),
    });
    if (!phase) throw new NotFoundException('Phase not found');
    return phase;
  }
}
