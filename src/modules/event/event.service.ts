import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, In, LessThan, LessThanOrEqual, Repository } from 'typeorm';
import {
  PaginatedResponseDto,
  PaginationQueryDto,
} from 'src/common/dto/pagination.dto';
import { PublicEventQueryDto } from './dto/public-event-query.dto';
import { Role } from 'src/common/enums/role.enum';

import { Event } from './entities/event.entity';
import { EventMedia } from './entities/event-media.entity';
import { EventDescription } from './entities/event-description.entity';
import { EventSession } from './entities/event-session.entity';
import { TicketTier } from './entities/ticket-tier.entity';
import { EventCustomField } from './entities/event-custom-field.entity';
import { EventBlacklist } from './entities/event-blacklist.entity';

import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CreateEventSessionDto } from './dto/create-event-session.dto';
import { UpdateEventSessionDto } from './dto/update-event-session.dto';
import { CreateTicketTierDto } from './dto/create-ticket-tier.dto';
import { UpdateTicketTierDto } from './dto/update-ticket-tier.dto';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';
import { UpdateCustomFieldDto } from './dto/update-custom-field.dto';
import { ScoringConfigDto } from './dto/scoring-config.dto';
import { CreateDescriptionDto } from './dto/create-description.dto';
import { UpdateDescriptionDto } from './dto/update-description.dto';
import { SetBlacklistDto } from './dto/blacklist.dto';
import { ReorderDto } from './dto/reorder.dto';

import { EventStatus } from './enums/event-status.enum';
import { CompetitionFormat } from './enums/competition-format.enum';

import { validateTimeline } from './validators/timeline.validator';
import { validateScoringConfig } from './validators/scoring-config.validator';
import { generateSlug } from './utils/slug.util';
import { parseBlacklist } from './utils/blacklist.util';
import { ProvinceService } from '../province/province.service';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    @InjectRepository(EventMedia)
    private readonly mediaRepo: Repository<EventMedia>,
    @InjectRepository(EventDescription)
    private readonly descRepo: Repository<EventDescription>,
    @InjectRepository(EventSession)
    private readonly sessionRepo: Repository<EventSession>,
    @InjectRepository(TicketTier)
    private readonly ticketRepo: Repository<TicketTier>,
    @InjectRepository(EventCustomField)
    private readonly fieldRepo: Repository<EventCustomField>,
    @InjectRepository(EventBlacklist)
    private readonly blacklistRepo: Repository<EventBlacklist>,
    private readonly provinceService: ProvinceService,
  ) {}

  // ─── Helpers ───

  async findEventOrFail(id: string): Promise<Event> {
    const event = await this.eventRepo.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Sự kiện không tồn tại.');
    return event;
  }

  assertOwnership(event: Event, userId: string, userRole: Role): void {
    if (userRole === Role.ADMIN) return;
    if (event.organizerId !== userId) {
      throw new ForbiddenException(
        'Bạn không có quyền thao tác trên sự kiện này.',
      );
    }
  }

  // ─── Event CRUD ───

  async create(dto: CreateEventDto, userId: string): Promise<Event> {
    validateTimeline(dto);

    const slug = dto.slug || generateSlug(dto.name);

    const existing = await this.eventRepo.findOne({ where: { slug } });
    if (existing) {
      throw new BadRequestException(
        'Slug đã tồn tại. Vui lòng chọn slug khác.',
      );
    }

    const event = this.eventRepo.create({
      ...dto,
      prefixCode: dto.prefixCode.toUpperCase(),
      slug,
      organizerId: userId,
      status: EventStatus.DRAFT,
      allowTransfer: dto.allowTransfer ?? true,
    });

    return this.eventRepo.save(event);
  }

  async findAllByOrganizer(
    userId: string,
    userRole: Role,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<Event>> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = userRole === Role.ADMIN ? {} : { organizerId: userId };

    const [events, total] = await this.eventRepo.findAndCount({
      where,
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return new PaginatedResponseDto(events, total, page, limit);
  }

  async findPublic(
    query: PublicEventQueryDto,
  ): Promise<PaginatedResponseDto<Event>> {
    const { page = 1, limit = 10, sportType, search } = query;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Event> = {
      status: In([EventStatus.PUBLISHED, EventStatus.LIVE]),
    };

    if (sportType) where.sportType = sportType;
    if (search) where.name = ILike(`%${search}%`);

    const [events, total] = await this.eventRepo.findAndCount({
      where,
      skip,
      take: limit,
      order: { eventStartTime: 'ASC' },
    });

    return new PaginatedResponseDto(events, total, page, limit);
  }

  async findById(id: string): Promise<Event & { provinceName: string | null; wardName: string | null }> {
    const event = await this.eventRepo.findOne({
      where: { id },
      relations: [
        'media',
        'descriptions',
        'sessions',
        'sessions.ticketTiers',
        'sessions.stages',
        'sessions.stages.matches',
        'customFields',
        'blacklist',
      ],
    });
    if (!event) throw new NotFoundException('Sự kiện không tồn tại.');

    const [province, ward] = await Promise.all([
      this.provinceService.getProvince(parseInt(event.provinceCode)).catch(() => null),
      this.provinceService.getWard(parseInt(event.wardCode)).catch(() => null),
    ]);

    return Object.assign(event, {
      provinceName: province?.name ?? null,
      wardName: ward?.name ?? null,
    });
  }

  async update(
    id: string,
    dto: UpdateEventDto,
    userId: string,
    userRole: Role,
  ): Promise<Event> {
    const event = await this.findEventOrFail(id);
    this.assertOwnership(event, userId, userRole);

    if (dto.prefixCode) {
      dto.prefixCode = dto.prefixCode.toUpperCase();
    }

    // Merge timeline fields for validation
    const mergedTimeline = {
      eventStartTime: dto.eventStartTime || event.eventStartTime,
      eventEndTime: dto.eventEndTime || event.eventEndTime,
      editInfoOpenTime: dto.editInfoOpenTime || event.editInfoOpenTime,
      editInfoCloseTime: dto.editInfoCloseTime || event.editInfoCloseTime,
      transferOpenTime: dto.transferOpenTime || event.transferOpenTime,
      transferCloseTime: dto.transferCloseTime || event.transferCloseTime,
      checkinOpenTime: dto.checkinOpenTime || event.checkinOpenTime,
      checkinCloseTime: dto.checkinCloseTime || event.checkinCloseTime,
      allowTransfer:
        dto.allowTransfer !== undefined
          ? dto.allowTransfer
          : event.allowTransfer,
    };
    validateTimeline(mergedTimeline);

    if (dto.slug && dto.slug !== event.slug) {
      const existing = await this.eventRepo.findOne({
        where: { slug: dto.slug },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException('Slug đã tồn tại.');
      }
    }

    Object.assign(event, dto);
    return this.eventRepo.save(event);
  }

  async delete(id: string, userId: string, userRole: Role): Promise<void> {
    const event = await this.findEventOrFail(id);
    this.assertOwnership(event, userId, userRole);

    if (event.status !== EventStatus.DRAFT) {
      throw new BadRequestException(
        'Chỉ có thể xóa sự kiện ở trạng thái nháp.',
      );
    }

    await this.eventRepo.remove(event);
  }

  // ─── Publish / Cancel ───

  async publish(id: string, userId: string, userRole: Role): Promise<Event> {
    const event = await this.eventRepo.findOne({
      where: { id },
      relations: ['sessions', 'sessions.ticketTiers'],
    });
    if (!event) throw new NotFoundException('Sự kiện không tồn tại.');
    this.assertOwnership(event, userId, userRole);

    if (event.status !== EventStatus.DRAFT) {
      throw new BadRequestException(
        'Chỉ có thể xuất bản sự kiện ở trạng thái nháp.',
      );
    }

    // Validate required fields
    const errors: string[] = [];
    if (!event.name) errors.push('Tên sự kiện là bắt buộc.');
    if (!event.hotline) errors.push('Hotline là bắt buộc.');
    if (!event.address) errors.push('Địa điểm là bắt buộc.');
    if (!event.provinceCode) errors.push('Tỉnh/Thành là bắt buộc.');
    if (!event.wardCode) errors.push('Phường/Xã là bắt buộc.');
    if (!event.prefixCode) errors.push('Mã tiền tố là bắt buộc.');
    if (!event.paymentMethods || event.paymentMethods.length === 0) {
      errors.push('Phương thức thanh toán là bắt buộc.');
    }
    console.log('Sessions for validation:', event.sessions);
    if (!event.sessions || event.sessions.length === 0) {
      errors.push('Cần ít nhất 1 hạng mục thi đấu.');
    }
    if (event.sessions) {
      for (const session of event.sessions) {
        if (!session.ticketTiers || session.ticketTiers.length === 0) {
          errors.push(`Hạng mục "${session.name}" cần ít nhất 1 loại vé.`);
        }
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    event.status = EventStatus.PUBLISHED;
    return this.eventRepo.save(event);
  }

  async cancel(id: string, userId: string, userRole: Role): Promise<Event> {
    const event = await this.findEventOrFail(id);
    this.assertOwnership(event, userId, userRole);

    if (
      event.status !== EventStatus.PUBLISHED &&
      event.status !== EventStatus.LIVE
    ) {
      throw new BadRequestException(
        'Chỉ có thể hủy sự kiện ở trạng thái đã xuất bản hoặc đang diễn ra.',
      );
    }

    event.status = EventStatus.CANCELLED;
    return this.eventRepo.save(event);
  }

  // ─── Auto status transitions (called by cron) ───

  async handleStatusTransitions(): Promise<void> {
    const now = new Date();

    await this.eventRepo.update(
      {
        status: EventStatus.PUBLISHED,
        eventStartTime: LessThanOrEqual(now),
      },
      { status: EventStatus.LIVE },
    );

    await this.eventRepo.update(
      { status: EventStatus.LIVE, eventEndTime: LessThan(now) },
      { status: EventStatus.CLOSED },
    );
  }

  // ─── Descriptions ───

  async addDescription(
    eventId: string,
    dto: CreateDescriptionDto,
    userId: string,
    userRole: Role,
  ): Promise<EventDescription> {
    const event = await this.findEventOrFail(eventId);
    this.assertOwnership(event, userId, userRole);

    const count = await this.descRepo.count({ where: { eventId } });

    const desc = this.descRepo.create({
      ...dto,
      eventId,
      sortOrder: count,
    });
    return this.descRepo.save(desc);
  }

  async updateDescription(
    eventId: string,
    descId: string,
    dto: UpdateDescriptionDto,
    userId: string,
    userRole: Role,
  ): Promise<EventDescription> {
    const event = await this.findEventOrFail(eventId);
    this.assertOwnership(event, userId, userRole);

    const desc = await this.descRepo.findOne({
      where: { id: descId, eventId },
    });
    if (!desc) throw new NotFoundException('Mô tả không tồn tại.');

    Object.assign(desc, dto);
    return this.descRepo.save(desc);
  }

  async deleteDescription(
    eventId: string,
    descId: string,
    userId: string,
    userRole: Role,
  ): Promise<void> {
    const event = await this.findEventOrFail(eventId);
    this.assertOwnership(event, userId, userRole);

    const desc = await this.descRepo.findOne({
      where: { id: descId, eventId },
    });
    if (!desc) throw new NotFoundException('Mô tả không tồn tại.');

    await this.descRepo.remove(desc);
  }

  async reorderDescriptions(
    eventId: string,
    dto: ReorderDto,
    userId: string,
    userRole: Role,
  ): Promise<void> {
    const event = await this.findEventOrFail(eventId);
    this.assertOwnership(event, userId, userRole);

    for (let i = 0; i < dto.ids.length; i++) {
      await this.descRepo.update({ id: dto.ids[i], eventId }, { sortOrder: i });
    }
  }

  // ─── Sessions ───

  async createSession(
    eventId: string,
    dto: CreateEventSessionDto,
    userId: string,
    userRole: Role,
  ): Promise<EventSession> {
    const event = await this.findEventOrFail(eventId);
    this.assertOwnership(event, userId, userRole);

    // Validate ticketCode uniqueness within event
    const existingCode = await this.sessionRepo.findOne({
      where: { eventId, ticketCode: dto.ticketCode.toUpperCase() },
    });
    if (existingCode) {
      throw new BadRequestException('Mã vé đã tồn tại trong sự kiện này.');
    }

    if (dto.competitionFormat === CompetitionFormat.SINGLES) {
      dto.requirePartner = false;
    }

    const session = this.sessionRepo.create({
      ...dto,
      ticketCode: dto.ticketCode.toUpperCase(),
      eventId,
    });
    return this.sessionRepo.save(session);
  }

  async updateSession(
    eventId: string,
    sessionId: string,
    dto: UpdateEventSessionDto,
    userId: string,
    userRole: Role,
  ): Promise<EventSession> {
    const event = await this.findEventOrFail(eventId);
    this.assertOwnership(event, userId, userRole);

    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, eventId },
    });
    if (!session) throw new NotFoundException('Hạng mục không tồn tại.');

    if (dto.ticketCode && dto.ticketCode !== session.ticketCode) {
      const existingCode = await this.sessionRepo.findOne({
        where: { eventId, ticketCode: dto.ticketCode.toUpperCase() },
      });
      if (existingCode && existingCode.id !== sessionId) {
        throw new BadRequestException('Mã vé đã tồn tại trong sự kiện này.');
      }
      dto.ticketCode = dto.ticketCode.toUpperCase();
    }

    Object.assign(session, dto);
    return this.sessionRepo.save(session);
  }

  async deleteSession(
    eventId: string,
    sessionId: string,
    userId: string,
    userRole: Role,
  ): Promise<void> {
    const event = await this.findEventOrFail(eventId);
    this.assertOwnership(event, userId, userRole);

    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, eventId },
    });
    if (!session) throw new NotFoundException('Hạng mục không tồn tại.');

    await this.sessionRepo.remove(session);
  }

  // ─── Ticket Tiers ───

  async createTicketTier(
    eventId: string,
    sessionId: string,
    dto: CreateTicketTierDto,
    userId: string,
    userRole: Role,
  ): Promise<TicketTier> {
    const event = await this.findEventOrFail(eventId);
    this.assertOwnership(event, userId, userRole);

    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, eventId },
    });
    if (!session) throw new NotFoundException('Hạng mục không tồn tại.');

    if (dto.isFree) {
      dto.price = null;
    }

    if (
      dto.minPerOrder &&
      dto.maxPerOrder &&
      dto.minPerOrder > dto.maxPerOrder
    ) {
      throw new BadRequestException(
        'Số lượng vé tối thiểu phải nhỏ hơn hoặc bằng tối đa.',
      );
    }

    const saleStart = new Date(dto.saleStartTime);
    const saleEnd = new Date(dto.saleEndTime);
    if (saleEnd <= saleStart) {
      throw new BadRequestException(
        'Ngày ngưng bán phải sau ngày bắt đầu bán.',
      );
    }

    const tier = this.ticketRepo.create({
      ...dto,
      sessionId,
    });
    return this.ticketRepo.save(tier);
  }

  async updateTicketTier(
    eventId: string,
    sessionId: string,
    ticketId: string,
    dto: UpdateTicketTierDto,
    userId: string,
    userRole: Role,
  ): Promise<TicketTier> {
    const event = await this.findEventOrFail(eventId);
    this.assertOwnership(event, userId, userRole);

    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, eventId },
    });
    if (!session) throw new NotFoundException('Hạng mục không tồn tại.');

    const tier = await this.ticketRepo.findOne({
      where: { id: ticketId, sessionId },
    });
    if (!tier) throw new NotFoundException('Loại vé không tồn tại.');

    if (dto.isFree) {
      dto.price = null;
    }

    Object.assign(tier, dto);
    return this.ticketRepo.save(tier);
  }

  async deleteTicketTier(
    eventId: string,
    sessionId: string,
    ticketId: string,
    userId: string,
    userRole: Role,
  ): Promise<void> {
    const event = await this.findEventOrFail(eventId);
    this.assertOwnership(event, userId, userRole);

    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, eventId },
    });
    if (!session) throw new NotFoundException('Hạng mục không tồn tại.');

    const tier = await this.ticketRepo.findOne({
      where: { id: ticketId, sessionId },
    });
    if (!tier) throw new NotFoundException('Loại vé không tồn tại.');

    await this.ticketRepo.remove(tier);
  }

  // ─── Custom Fields ───

  async addCustomField(
    eventId: string,
    dto: CreateCustomFieldDto,
    userId: string,
    userRole: Role,
  ): Promise<EventCustomField> {
    const event = await this.findEventOrFail(eventId);
    this.assertOwnership(event, userId, userRole);

    // Validate dbMapping uniqueness
    if (dto.dbMapping) {
      const existing = await this.fieldRepo.findOne({
        where: { eventId, dbMapping: dto.dbMapping },
      });
      if (existing) {
        throw new BadRequestException(
          `Trường dữ liệu "${dto.dbMapping}" đã được sử dụng.`,
        );
      }
    }

    const count = await this.fieldRepo.count({ where: { eventId } });
    const field = this.fieldRepo.create({
      ...dto,
      eventId,
      sortOrder: count,
    });
    return this.fieldRepo.save(field);
  }

  async updateCustomField(
    eventId: string,
    fieldId: string,
    dto: UpdateCustomFieldDto,
    userId: string,
    userRole: Role,
  ): Promise<EventCustomField> {
    const event = await this.findEventOrFail(eventId);
    this.assertOwnership(event, userId, userRole);

    const field = await this.fieldRepo.findOne({
      where: { id: fieldId, eventId },
    });
    if (!field) throw new NotFoundException('Trường dữ liệu không tồn tại.');

    if (dto.dbMapping && dto.dbMapping !== field.dbMapping) {
      const existing = await this.fieldRepo.findOne({
        where: { eventId, dbMapping: dto.dbMapping },
      });
      if (existing && existing.id !== fieldId) {
        throw new BadRequestException(
          `Trường dữ liệu "${dto.dbMapping}" đã được sử dụng.`,
        );
      }
    }

    Object.assign(field, dto);
    return this.fieldRepo.save(field);
  }

  async deleteCustomField(
    eventId: string,
    fieldId: string,
    userId: string,
    userRole: Role,
  ): Promise<void> {
    const event = await this.findEventOrFail(eventId);
    this.assertOwnership(event, userId, userRole);

    if (event.status !== EventStatus.DRAFT) {
      throw new BadRequestException(
        'Không thể xóa câu hỏi khi sự kiện đã được xuất bản.',
      );
    }

    const field = await this.fieldRepo.findOne({
      where: { id: fieldId, eventId },
    });
    if (!field) throw new NotFoundException('Trường dữ liệu không tồn tại.');

    await this.fieldRepo.remove(field);
  }

  async reorderCustomFields(
    eventId: string,
    dto: ReorderDto,
    userId: string,
    userRole: Role,
  ): Promise<void> {
    const event = await this.findEventOrFail(eventId);
    this.assertOwnership(event, userId, userRole);

    for (let i = 0; i < dto.ids.length; i++) {
      await this.fieldRepo.update(
        { id: dto.ids[i], eventId },
        { sortOrder: i },
      );
    }
  }

  async getCustomFields(eventId: string): Promise<EventCustomField[]> {
    await this.findEventOrFail(eventId);
    return this.fieldRepo.find({
      where: { eventId },
      order: { sortOrder: 'ASC' },
    });
  }

  // ─── Scoring Config ───

  async saveScoringConfig(
    eventId: string,
    dto: ScoringConfigDto,
    userId: string,
    userRole: Role,
  ): Promise<Event> {
    const event = await this.findEventOrFail(eventId);
    this.assertOwnership(event, userId, userRole);

    validateScoringConfig(dto);

    event.scoringConfig = dto as any;
    return this.eventRepo.save(event);
  }

  async getScoringConfig(eventId: string): Promise<Record<string, any> | null> {
    const event = await this.findEventOrFail(eventId);
    return event.scoringConfig;
  }

  // ─── Blacklist ───

  async setBlacklist(
    eventId: string,
    dto: SetBlacklistDto,
    userId: string,
    userRole: Role,
  ): Promise<EventBlacklist[]> {
    const event = await this.findEventOrFail(eventId);
    this.assertOwnership(event, userId, userRole);

    // Delete existing
    await this.blacklistRepo.delete({ eventId });

    const entries = parseBlacklist(dto.raw);
    if (entries.length === 0) return [];

    const entities = entries.map((e) =>
      this.blacklistRepo.create({ ...e, eventId }),
    );
    return this.blacklistRepo.save(entities);
  }

  async getBlacklist(eventId: string): Promise<EventBlacklist[]> {
    await this.findEventOrFail(eventId);
    return this.blacklistRepo.find({ where: { eventId } });
  }

  // ─── Media ───

  async addMedia(
    eventId: string,
    mediaData: Partial<EventMedia>,
    userId: string,
    userRole: Role,
  ): Promise<EventMedia> {
    const event = await this.findEventOrFail(eventId);
    this.assertOwnership(event, userId, userRole);

    const media = this.mediaRepo.create({ ...mediaData, eventId });
    return this.mediaRepo.save(media);
  }

  async deleteMedia(
    eventId: string,
    mediaId: string,
    userId: string,
    userRole: Role,
  ): Promise<void> {
    const event = await this.findEventOrFail(eventId);
    this.assertOwnership(event, userId, userRole);

    const media = await this.mediaRepo.findOne({
      where: { id: mediaId, eventId },
    });
    if (!media) throw new NotFoundException('Media không tồn tại.');

    await this.mediaRepo.remove(media);
  }
}
