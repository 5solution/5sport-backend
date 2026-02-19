import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';

import { EventService } from './event.service';
import { ProvinceService } from '../province/province.service';
import { Event } from './entities/event.entity';
import { EventMedia } from './entities/event-media.entity';
import { EventDescription } from './entities/event-description.entity';
import { EventSession } from './entities/event-session.entity';
import { TicketTier } from './entities/ticket-tier.entity';
import { EventCustomField } from './entities/event-custom-field.entity';
import { EventBlacklist } from './entities/event-blacklist.entity';
import { EventStatus } from './enums/event-status.enum';
import { SportType } from './enums/sport-type.enum';
import { PaymentMethod } from './enums/payment-method.enum';
import { MatchType } from './enums/match-type.enum';
import { FieldType } from './enums/field-type.enum';
import { Role } from 'src/common/enums/role.enum';

type MockRepository<T = any> = Partial<
  Record<keyof Repository<T>, ReturnType<typeof vi.fn>>
>;

function createMockRepository<T = any>(): MockRepository<T> {
  return {
    create: vi.fn().mockImplementation((dto) => dto),
    save: vi.fn().mockImplementation((entity) => Promise.resolve({ id: 'generated-uuid', ...entity })),
    findOne: vi.fn(),
    findAndCount: vi.fn(),
    find: vi.fn(),
    count: vi.fn().mockResolvedValue(0),
    update: vi.fn().mockResolvedValue({ affected: 1 }),
    delete: vi.fn().mockResolvedValue({ affected: 1 }),
    remove: vi.fn().mockResolvedValue(undefined),
  };
}

describe('EventService', () => {
  let service: EventService;
  let eventRepo: MockRepository<Event>;
  let mediaRepo: MockRepository<EventMedia>;
  let descRepo: MockRepository<EventDescription>;
  let sessionRepo: MockRepository<EventSession>;
  let ticketRepo: MockRepository<TicketTier>;
  let fieldRepo: MockRepository<EventCustomField>;
  let blacklistRepo: MockRepository<EventBlacklist>;

  const userId = 'user-1';
  const adminId = 'admin-1';

  const baseCreateDto = {
    name: 'Giải Pickleball Hà Nội 2026',
    sportType: SportType.PICKLEBALL,
    hotline: '0901234567',
    address: 'Sân 1, Đường ABC',
    provinceCode: '01',
    wardCode: '001',
    prefixCode: 'pkb',
    eventStartTime: '2026-03-01T08:00:00Z',
    eventEndTime: '2026-03-02T18:00:00Z',
    editInfoOpenTime: '2026-02-01T00:00:00Z',
    editInfoCloseTime: '2026-02-28T23:59:59Z',
    checkinOpenTime: '2026-03-01T06:00:00Z',
    checkinCloseTime: '2026-03-01T10:00:00Z',
    paymentMethods: [PaymentMethod.VNPAY_QR],
  };

  beforeEach(async () => {
    eventRepo = createMockRepository();
    mediaRepo = createMockRepository();
    descRepo = createMockRepository();
    sessionRepo = createMockRepository();
    ticketRepo = createMockRepository();
    fieldRepo = createMockRepository();
    blacklistRepo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        { provide: getRepositoryToken(Event), useValue: eventRepo },
        { provide: getRepositoryToken(EventMedia), useValue: mediaRepo },
        { provide: getRepositoryToken(EventDescription), useValue: descRepo },
        { provide: getRepositoryToken(EventSession), useValue: sessionRepo },
        { provide: getRepositoryToken(TicketTier), useValue: ticketRepo },
        { provide: getRepositoryToken(EventCustomField), useValue: fieldRepo },
        { provide: getRepositoryToken(EventBlacklist), useValue: blacklistRepo },
        {
          provide: ProvinceService,
          useValue: {
            getProvince: vi.fn().mockResolvedValue({ name: 'Thành phố Hà Nội' }),
            getWard: vi.fn().mockResolvedValue({ name: 'Phường Láng Hạ' }),
          },
        },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
  });

  // ─── CREATE ───

  describe('create', () => {
    it('should create an event in DRAFT status', async () => {
      eventRepo.findOne.mockResolvedValue(null); // slug not taken

      const result = await service.create(baseCreateDto, userId);

      expect(result.status).toBe(EventStatus.DRAFT);
      expect(result.organizerId).toBe(userId);
      expect(result.prefixCode).toBe('PKB');
      expect(eventRepo.save).toHaveBeenCalled();
    });

    it('should auto-generate slug from name', async () => {
      eventRepo.findOne.mockResolvedValue(null);

      const result = await service.create(baseCreateDto, userId);

      expect(result.slug).toBe('giai-pickleball-ha-noi-2026');
    });

    it('should use provided slug if given', async () => {
      eventRepo.findOne.mockResolvedValue(null);

      const result = await service.create(
        { ...baseCreateDto, slug: 'my-custom-slug' },
        userId,
      );

      expect(result.slug).toBe('my-custom-slug');
    });

    it('should throw if slug already exists', async () => {
      eventRepo.findOne.mockResolvedValue({ id: 'other' });

      await expect(service.create(baseCreateDto, userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if eventEndTime <= eventStartTime', async () => {
      eventRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create(
          {
            ...baseCreateDto,
            eventEndTime: '2026-03-01T07:00:00Z',
          },
          userId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should default allowTransfer to true', async () => {
      eventRepo.findOne.mockResolvedValue(null);

      const result = await service.create(baseCreateDto, userId);

      expect(result.allowTransfer).toBe(true);
    });

    it('should uppercase prefixCode', async () => {
      eventRepo.findOne.mockResolvedValue(null);

      const result = await service.create(
        { ...baseCreateDto, prefixCode: 'abc' },
        userId,
      );

      expect(result.prefixCode).toBe('ABC');
    });
  });

  // ─── FIND ───

  describe('findById', () => {
    it('should return event with relations', async () => {
      const event = { id: 'e1', name: 'Test' };
      eventRepo.findOne.mockResolvedValue(event);

      const result = await service.findById('e1');
      expect(result).toEqual(event);
    });

    it('should throw NotFoundException if not found', async () => {
      eventRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAllByOrganizer', () => {
    it('should filter by organizerId for organizer role', async () => {
      eventRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAllByOrganizer(userId, Role.ORGANIZER, {
        page: 1,
        limit: 10,
      });

      expect(eventRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizerId: userId },
        }),
      );
    });

    it('should not filter by organizerId for admin', async () => {
      eventRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAllByOrganizer(adminId, Role.ADMIN, {
        page: 1,
        limit: 10,
      });

      expect(eventRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });
  });

  // ─── UPDATE ───

  describe('update', () => {
    const existingEvent = {
      id: 'e1',
      organizerId: userId,
      eventStartTime: new Date('2026-03-01T08:00:00Z'),
      eventEndTime: new Date('2026-03-02T18:00:00Z'),
      editInfoOpenTime: new Date('2026-02-01T00:00:00Z'),
      editInfoCloseTime: new Date('2026-02-28T23:59:59Z'),
      checkinOpenTime: new Date('2026-03-01T06:00:00Z'),
      checkinCloseTime: new Date('2026-03-01T10:00:00Z'),
      allowTransfer: true,
      slug: 'existing-slug',
    };

    it('should update event fields', async () => {
      eventRepo.findOne.mockResolvedValue({ ...existingEvent });

      const result = await service.update(
        'e1',
        { name: 'New Name' },
        userId,
        Role.ORGANIZER,
      );

      expect(eventRepo.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if not owner (non-admin)', async () => {
      eventRepo.findOne.mockResolvedValue({
        ...existingEvent,
        organizerId: 'other-user',
      });

      await expect(
        service.update('e1', { name: 'New' }, userId, Role.ORGANIZER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to update any event', async () => {
      eventRepo.findOne.mockResolvedValue({
        ...existingEvent,
        organizerId: 'other-user',
      });

      await service.update('e1', { name: 'New' }, adminId, Role.ADMIN);

      expect(eventRepo.save).toHaveBeenCalled();
    });

    it('should uppercase prefixCode on update', async () => {
      eventRepo.findOne.mockResolvedValue({ ...existingEvent });

      await service.update(
        'e1',
        { prefixCode: 'abc' },
        userId,
        Role.ORGANIZER,
      );

      expect(eventRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ prefixCode: 'ABC' }),
      );
    });

    it('should throw if new slug conflicts with another event', async () => {
      eventRepo.findOne
        .mockResolvedValueOnce({ ...existingEvent }) // findEventOrFail
        .mockResolvedValueOnce({ id: 'other-event' }); // slug check

      await expect(
        service.update(
          'e1',
          { slug: 'taken-slug' },
          userId,
          Role.ORGANIZER,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── DELETE ───

  describe('delete', () => {
    it('should delete draft event', async () => {
      eventRepo.findOne.mockResolvedValue({
        id: 'e1',
        organizerId: userId,
        status: EventStatus.DRAFT,
      });

      await service.delete('e1', userId, Role.ORGANIZER);

      expect(eventRepo.remove).toHaveBeenCalled();
    });

    it('should throw if event is not DRAFT', async () => {
      eventRepo.findOne.mockResolvedValue({
        id: 'e1',
        organizerId: userId,
        status: EventStatus.PUBLISHED,
      });

      await expect(
        service.delete('e1', userId, Role.ORGANIZER),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if event not found', async () => {
      eventRepo.findOne.mockResolvedValue(null);

      await expect(
        service.delete('nonexistent', userId, Role.ORGANIZER),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── PUBLISH ───

  describe('publish', () => {
    it('should publish a valid draft event', async () => {
      eventRepo.findOne.mockResolvedValue({
        id: 'e1',
        organizerId: userId,
        status: EventStatus.DRAFT,
        name: 'Test',
        hotline: '0901234567',
        address: 'ABC',
        provinceCode: '01',
        wardCode: '001',
        prefixCode: 'PKB',
        paymentMethods: [PaymentMethod.VNPAY_QR],
        sessions: [
          {
            name: 'Session 1',
            ticketTiers: [{ name: 'Tier 1' }],
          },
        ],
      });

      const result = await service.publish('e1', userId, Role.ORGANIZER);

      expect(result.status).toBe(EventStatus.PUBLISHED);
    });

    it('should throw if event is not DRAFT', async () => {
      eventRepo.findOne.mockResolvedValue({
        id: 'e1',
        organizerId: userId,
        status: EventStatus.PUBLISHED,
      });

      await expect(
        service.publish('e1', userId, Role.ORGANIZER),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if no sessions', async () => {
      eventRepo.findOne.mockResolvedValue({
        id: 'e1',
        organizerId: userId,
        status: EventStatus.DRAFT,
        name: 'Test',
        hotline: '09',
        address: 'A',
        provinceCode: '01',
        wardCode: '001',
        prefixCode: 'P',
        paymentMethods: [PaymentMethod.VNPAY_QR],
        sessions: [],
      });

      await expect(
        service.publish('e1', userId, Role.ORGANIZER),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if session has no ticket tiers', async () => {
      eventRepo.findOne.mockResolvedValue({
        id: 'e1',
        organizerId: userId,
        status: EventStatus.DRAFT,
        name: 'Test',
        hotline: '09',
        address: 'A',
        provinceCode: '01',
        wardCode: '001',
        prefixCode: 'P',
        paymentMethods: [PaymentMethod.VNPAY_QR],
        sessions: [{ name: 'S1', ticketTiers: [] }],
      });

      await expect(
        service.publish('e1', userId, Role.ORGANIZER),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if missing required fields', async () => {
      eventRepo.findOne.mockResolvedValue({
        id: 'e1',
        organizerId: userId,
        status: EventStatus.DRAFT,
        name: '',
        hotline: '',
        address: '',
        provinceCode: '',
        wardCode: '',
        prefixCode: '',
        paymentMethods: [],
        sessions: [],
      });

      try {
        await service.publish('e1', userId, Role.ORGANIZER);
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        const response = (e as BadRequestException).getResponse();
        expect((response as any).message.length).toBeGreaterThan(1);
      }
    });
  });

  // ─── CANCEL ───

  describe('cancel', () => {
    it('should cancel PUBLISHED event', async () => {
      eventRepo.findOne.mockResolvedValue({
        id: 'e1',
        organizerId: userId,
        status: EventStatus.PUBLISHED,
      });

      const result = await service.cancel('e1', userId, Role.ORGANIZER);
      expect(result.status).toBe(EventStatus.CANCELLED);
    });

    it('should cancel LIVE event', async () => {
      eventRepo.findOne.mockResolvedValue({
        id: 'e1',
        organizerId: userId,
        status: EventStatus.LIVE,
      });

      const result = await service.cancel('e1', userId, Role.ORGANIZER);
      expect(result.status).toBe(EventStatus.CANCELLED);
    });

    it('should throw if event is DRAFT', async () => {
      eventRepo.findOne.mockResolvedValue({
        id: 'e1',
        organizerId: userId,
        status: EventStatus.DRAFT,
      });

      await expect(
        service.cancel('e1', userId, Role.ORGANIZER),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if event is CLOSED', async () => {
      eventRepo.findOne.mockResolvedValue({
        id: 'e1',
        organizerId: userId,
        status: EventStatus.CLOSED,
      });

      await expect(
        service.cancel('e1', userId, Role.ORGANIZER),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── STATUS TRANSITIONS ───

  describe('handleStatusTransitions', () => {
    it('should call update for Published->Live and Live->Closed', async () => {
      await service.handleStatusTransitions();

      expect(eventRepo.update).toHaveBeenCalledTimes(2);
    });
  });

  // ─── SESSIONS ───

  describe('createSession', () => {
    beforeEach(() => {
      eventRepo.findOne.mockResolvedValue({
        id: 'e1',
        organizerId: userId,
      });
    });

    it('should create a session', async () => {
      sessionRepo.findOne.mockResolvedValue(null); // ticketCode not taken

      const result = await service.createSession(
        'e1',
        {
          name: 'Đơn Nam',
          matchType: MatchType.SINGLES,
          startTime: '2026-03-01T08:00:00Z',
          endTime: '2026-03-01T18:00:00Z',
          ticketCode: 'abc',
        },
        userId,
        Role.ORGANIZER,
      );

      expect(result.ticketCode).toBe('ABC');
      expect(result.eventId).toBe('e1');
    });

    it('should throw if ticketCode already exists in event', async () => {
      sessionRepo.findOne.mockResolvedValue({ id: 'existing' });

      await expect(
        service.createSession(
          'e1',
          {
            name: 'Đơn Nam',
            matchType: MatchType.SINGLES,
            startTime: '2026-03-01T08:00:00Z',
            endTime: '2026-03-01T18:00:00Z',
            ticketCode: 'ABC',
          },
          userId,
          Role.ORGANIZER,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should force requirePartner=false for SINGLES', async () => {
      sessionRepo.findOne.mockResolvedValue(null);

      const dto = {
        name: 'Đơn',
        matchType: MatchType.SINGLES,
        startTime: '2026-03-01T08:00:00Z',
        endTime: '2026-03-01T18:00:00Z',
        ticketCode: 'DNM',
        requirePartner: true,
      };

      const result = await service.createSession(
        'e1',
        dto,
        userId,
        Role.ORGANIZER,
      );

      expect(result.requirePartner).toBe(false);
    });
  });

  describe('deleteSession', () => {
    it('should delete session', async () => {
      eventRepo.findOne.mockResolvedValue({
        id: 'e1',
        organizerId: userId,
      });
      sessionRepo.findOne.mockResolvedValue({ id: 's1', eventId: 'e1' });

      await service.deleteSession('e1', 's1', userId, Role.ORGANIZER);
      expect(sessionRepo.remove).toHaveBeenCalled();
    });

    it('should throw if session not found', async () => {
      eventRepo.findOne.mockResolvedValue({
        id: 'e1',
        organizerId: userId,
      });
      sessionRepo.findOne.mockResolvedValue(null);

      await expect(
        service.deleteSession('e1', 's999', userId, Role.ORGANIZER),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── TICKET TIERS ───

  describe('createTicketTier', () => {
    beforeEach(() => {
      eventRepo.findOne.mockResolvedValue({
        id: 'e1',
        organizerId: userId,
      });
      sessionRepo.findOne.mockResolvedValue({ id: 's1', eventId: 'e1' });
    });

    it('should create a ticket tier', async () => {
      const result = await service.createTicketTier(
        'e1',
        's1',
        {
          name: 'Early Bird',
          totalQuantity: 100,
          maxPerOrder: 5,
          saleStartTime: '2026-02-01T00:00:00Z',
          saleEndTime: '2026-02-28T23:59:59Z',
        },
        userId,
        Role.ORGANIZER,
      );

      expect(result.sessionId).toBe('s1');
    });

    it('should set price to null if isFree', async () => {
      const result = await service.createTicketTier(
        'e1',
        's1',
        {
          name: 'Free Tier',
          isFree: true,
          price: 50000,
          totalQuantity: 50,
          maxPerOrder: 2,
          saleStartTime: '2026-02-01T00:00:00Z',
          saleEndTime: '2026-02-28T23:59:59Z',
        },
        userId,
        Role.ORGANIZER,
      );

      expect(result.price).toBeNull();
    });

    it('should throw if minPerOrder > maxPerOrder', async () => {
      await expect(
        service.createTicketTier(
          'e1',
          's1',
          {
            name: 'Tier',
            totalQuantity: 100,
            minPerOrder: 10,
            maxPerOrder: 5,
            saleStartTime: '2026-02-01T00:00:00Z',
            saleEndTime: '2026-02-28T23:59:59Z',
          },
          userId,
          Role.ORGANIZER,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if saleEndTime <= saleStartTime', async () => {
      await expect(
        service.createTicketTier(
          'e1',
          's1',
          {
            name: 'Tier',
            totalQuantity: 100,
            maxPerOrder: 5,
            saleStartTime: '2026-02-28T23:59:59Z',
            saleEndTime: '2026-02-01T00:00:00Z',
          },
          userId,
          Role.ORGANIZER,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if session not found', async () => {
      sessionRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createTicketTier(
          'e1',
          'non-existent',
          {
            name: 'Tier',
            totalQuantity: 100,
            maxPerOrder: 5,
            saleStartTime: '2026-02-01T00:00:00Z',
            saleEndTime: '2026-02-28T23:59:59Z',
          },
          userId,
          Role.ORGANIZER,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── CUSTOM FIELDS ───

  describe('addCustomField', () => {
    beforeEach(() => {
      eventRepo.findOne.mockResolvedValue({
        id: 'e1',
        organizerId: userId,
        status: EventStatus.DRAFT,
      });
    });

    it('should add a custom field', async () => {
      fieldRepo.findOne.mockResolvedValue(null);

      const result = await service.addCustomField(
        'e1',
        {
          label: 'Tên',
          fieldName: 'name',
          fieldType: FieldType.TEXT,
          dbMapping: 'participantName',
        },
        userId,
        Role.ORGANIZER,
      );

      expect(result.eventId).toBe('e1');
    });

    it('should throw if dbMapping already used in event', async () => {
      fieldRepo.findOne.mockResolvedValue({ id: 'existing' });

      await expect(
        service.addCustomField(
          'e1',
          {
            label: 'Tên',
            fieldName: 'name',
            fieldType: FieldType.TEXT,
            dbMapping: 'participantName',
          },
          userId,
          Role.ORGANIZER,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteCustomField', () => {
    it('should delete field when event is DRAFT', async () => {
      eventRepo.findOne.mockResolvedValue({
        id: 'e1',
        organizerId: userId,
        status: EventStatus.DRAFT,
      });
      fieldRepo.findOne.mockResolvedValue({ id: 'f1', eventId: 'e1' });

      await service.deleteCustomField('e1', 'f1', userId, Role.ORGANIZER);
      expect(fieldRepo.remove).toHaveBeenCalled();
    });

    it('should throw if event is PUBLISHED', async () => {
      eventRepo.findOne.mockResolvedValue({
        id: 'e1',
        organizerId: userId,
        status: EventStatus.PUBLISHED,
      });

      await expect(
        service.deleteCustomField('e1', 'f1', userId, Role.ORGANIZER),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── SCORING CONFIG ───

  describe('saveScoringConfig', () => {
    it('should save valid scoring config', async () => {
      eventRepo.findOne.mockResolvedValue({
        id: 'e1',
        organizerId: userId,
      });

      const result = await service.saveScoringConfig(
        'e1',
        {
          sportType: SportType.PICKLEBALL,
          scoringMode: 'SIDE_OUT',
          matchFormat: '1_SET',
          pointsToWin: 11,
          winByTwo: true,
          pointCap: 15,
          switchEndsAt: 6,
        },
        userId,
        Role.ORGANIZER,
      );

      expect(eventRepo.save).toHaveBeenCalled();
    });

    it('should throw for invalid scoring config', async () => {
      eventRepo.findOne.mockResolvedValue({
        id: 'e1',
        organizerId: userId,
      });

      await expect(
        service.saveScoringConfig(
          'e1',
          {
            sportType: SportType.PICKLEBALL,
            scoringMode: 'SIDE_OUT',
            matchFormat: '1_SET',
            pointsToWin: 5,
            winByTwo: true,
          },
          userId,
          Role.ORGANIZER,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── BLACKLIST ───

  describe('setBlacklist', () => {
    it('should replace blacklist', async () => {
      eventRepo.findOne.mockResolvedValue({
        id: 'e1',
        organizerId: userId,
      });

      await service.setBlacklist(
        'e1',
        { raw: 'test@email.com 0901234567' },
        userId,
        Role.ORGANIZER,
      );

      expect(blacklistRepo.delete).toHaveBeenCalledWith({ eventId: 'e1' });
      expect(blacklistRepo.save).toHaveBeenCalled();
    });

    it('should handle empty blacklist', async () => {
      eventRepo.findOne.mockResolvedValue({
        id: 'e1',
        organizerId: userId,
      });

      const result = await service.setBlacklist(
        'e1',
        { raw: '' },
        userId,
        Role.ORGANIZER,
      );

      expect(result).toEqual([]);
    });
  });

  // ─── DESCRIPTIONS ───

  describe('addDescription', () => {
    it('should add a description', async () => {
      eventRepo.findOne.mockResolvedValue({
        id: 'e1',
        organizerId: userId,
      });

      const result = await service.addDescription(
        'e1',
        { title: 'Intro', content: '<p>Hello</p>' },
        userId,
        Role.ORGANIZER,
      );

      expect(result.eventId).toBe('e1');
    });
  });

  describe('deleteDescription', () => {
    it('should delete description', async () => {
      eventRepo.findOne.mockResolvedValue({
        id: 'e1',
        organizerId: userId,
      });
      descRepo.findOne.mockResolvedValue({ id: 'd1', eventId: 'e1' });

      await service.deleteDescription('e1', 'd1', userId, Role.ORGANIZER);
      expect(descRepo.remove).toHaveBeenCalled();
    });

    it('should throw if description not found', async () => {
      eventRepo.findOne.mockResolvedValue({
        id: 'e1',
        organizerId: userId,
      });
      descRepo.findOne.mockResolvedValue(null);

      await expect(
        service.deleteDescription('e1', 'd999', userId, Role.ORGANIZER),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── MEDIA ───

  describe('addMedia', () => {
    it('should add media', async () => {
      eventRepo.findOne.mockResolvedValue({
        id: 'e1',
        organizerId: userId,
      });

      const result = await service.addMedia(
        'e1',
        { url: 'https://s3/logo.png', fileSize: 1024, mimeType: 'image/png' },
        userId,
        Role.ORGANIZER,
      );

      expect(result.eventId).toBe('e1');
    });
  });

  describe('deleteMedia', () => {
    it('should throw if media not found', async () => {
      eventRepo.findOne.mockResolvedValue({
        id: 'e1',
        organizerId: userId,
      });
      mediaRepo.findOne.mockResolvedValue(null);

      await expect(
        service.deleteMedia('e1', 'm999', userId, Role.ORGANIZER),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── OWNERSHIP ───

  describe('assertOwnership', () => {
    it('should pass for admin', () => {
      expect(() =>
        service.assertOwnership(
          { organizerId: 'other' } as Event,
          adminId,
          Role.ADMIN,
        ),
      ).not.toThrow();
    });

    it('should pass for owner', () => {
      expect(() =>
        service.assertOwnership(
          { organizerId: userId } as Event,
          userId,
          Role.ORGANIZER,
        ),
      ).not.toThrow();
    });

    it('should throw for non-owner non-admin', () => {
      expect(() =>
        service.assertOwnership(
          { organizerId: 'other' } as Event,
          userId,
          Role.ORGANIZER,
        ),
      ).toThrow(ForbiddenException);
    });
  });
});
