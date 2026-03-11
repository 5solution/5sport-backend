import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Campaign, CampaignDocument } from './schemas/campaign.schema';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { UpdateCampaignStatusDto } from './dto/update-campaign-status.dto';
import { CampaignStatus } from './enums/campaign-status.enum';
import { Role } from 'src/common/enums/role.enum';
import { PaginatedResponseDto, PaginationQueryDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class CampaignService {
  constructor(
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
  ) {}

  async create(creatorId: string, dto: CreateCampaignDto): Promise<CampaignDocument> {
    const existing = await this.campaignModel.findOne({ slug: dto.slug });
    if (existing) throw new BadRequestException('Slug already exists');
    const campaign = new this.campaignModel({ ...dto, creatorId });
    return campaign.save();
  }

  async findAll(user: any): Promise<CampaignDocument[]> {
    if (user.role === Role.ADMIN) {
      return this.campaignModel.find().sort({ createdAt: -1 });
    }
    return this.campaignModel.find({ creatorId: user.id }).sort({ createdAt: -1 });
  }

  async findById(id: string): Promise<CampaignDocument> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Campaign not found');
    const campaign = await this.campaignModel.findById(id);
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async findPublic(query: PaginationQueryDto): Promise<PaginatedResponseDto<CampaignDocument>> {
    const filter = { status: { $in: [CampaignStatus.ACTIVE, CampaignStatus.CLOSED] } };
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.campaignModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      this.campaignModel.countDocuments(filter),
    ]);

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findBySlug(slug: string): Promise<CampaignDocument> {
    const campaign = await this.campaignModel.findOne({
      slug,
      status: { $in: [CampaignStatus.ACTIVE, CampaignStatus.CLOSED] },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async update(id: string, user: any, dto: UpdateCampaignDto): Promise<CampaignDocument> {
    const campaign = await this.findById(id);
    this.assertOwnership(campaign, user);
    if (dto.slug && dto.slug !== campaign.slug) {
      const existing = await this.campaignModel.findOne({ slug: dto.slug });
      if (existing) throw new BadRequestException('Slug already exists');
    }
    Object.assign(campaign, dto);
    return campaign.save();
  }

  async remove(id: string, user: any): Promise<void> {
    const campaign = await this.findById(id);
    if (user.role !== Role.ADMIN) throw new ForbiddenException('Only admin can delete campaigns');
    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT campaigns can be deleted');
    }
    await campaign.deleteOne();
  }

  async updateStatus(id: string, user: any, dto: UpdateCampaignStatusDto): Promise<CampaignDocument> {
    const campaign = await this.findById(id);
    this.assertOwnership(campaign, user);
    campaign.status = dto.status;
    return campaign.save();
  }

  private assertOwnership(campaign: CampaignDocument, user: any): void {
    if (user.role !== Role.ADMIN && campaign.creatorId !== user.id) {
      throw new ForbiddenException('You do not own this campaign');
    }
  }
}
