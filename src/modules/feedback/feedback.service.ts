import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from './feedback.entity';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackStatusDto } from './dto/update-feedback-status.dto';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepo: Repository<Feedback>,
  ) {}

  async create(dto: CreateFeedbackDto, userId?: string): Promise<Feedback> {
    const feedback = this.feedbackRepo.create({
      ...dto,
      userId: userId || null,
    });
    return this.feedbackRepo.save(feedback);
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
  }): Promise<{ data: Feedback[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;

    const [data, total] = await this.feedbackRepo.findAndCount({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async findOne(id: string): Promise<Feedback> {
    const feedback = await this.feedbackRepo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!feedback) throw new NotFoundException('Feedback not found');
    return feedback;
  }

  async updateStatus(id: string, dto: UpdateFeedbackStatusDto): Promise<Feedback> {
    const feedback = await this.findOne(id);
    feedback.status = dto.status;
    if (dto.adminNote !== undefined) feedback.adminNote = dto.adminNote;
    return this.feedbackRepo.save(feedback);
  }

  async remove(id: string): Promise<void> {
    const feedback = await this.findOne(id);
    await this.feedbackRepo.remove(feedback);
  }
}
