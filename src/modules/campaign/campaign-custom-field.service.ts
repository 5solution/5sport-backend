import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CampaignCustomField, CampaignCustomFieldDocument } from './schemas/campaign-custom-field.schema';
import { CreateCampaignCustomFieldDto } from './dto/create-campaign-custom-field.dto';

@Injectable()
export class CampaignCustomFieldService {
  constructor(
    @InjectModel(CampaignCustomField.name) private fieldModel: Model<CampaignCustomFieldDocument>,
  ) {}

  async create(campaignId: string, dto: CreateCampaignCustomFieldDto): Promise<CampaignCustomFieldDocument> {
    const field = new this.fieldModel({ ...dto, campaignId: new Types.ObjectId(campaignId) });
    return field.save();
  }

  async findAll(campaignId: string): Promise<CampaignCustomFieldDocument[]> {
    return this.fieldModel.find({ campaignId: new Types.ObjectId(campaignId) }).sort({ sortOrder: 1 });
  }

  async update(campaignId: string, id: string, dto: Partial<CreateCampaignCustomFieldDto>): Promise<CampaignCustomFieldDocument> {
    const field = await this.findOrFail(campaignId, id);
    Object.assign(field, dto);
    return field.save();
  }

  async remove(campaignId: string, id: string): Promise<void> {
    const field = await this.findOrFail(campaignId, id);
    await field.deleteOne();
  }

  private async findOrFail(campaignId: string, id: string): Promise<CampaignCustomFieldDocument> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Custom field not found');
    const field = await this.fieldModel.findOne({
      _id: new Types.ObjectId(id),
      campaignId: new Types.ObjectId(campaignId),
    });
    if (!field) throw new NotFoundException('Custom field not found');
    return field;
  }
}
