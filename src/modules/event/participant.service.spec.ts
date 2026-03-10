import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ParticipantService } from './participant.service';
import { EventParticipant } from './entities';
import { ParticipantStatus } from './entities/event-participant.entity';
import { Stage } from './entities/stage.entity';
import { EventSession } from './entities/event-session.entity';

describe('ParticipantService', () => {
  let service: ParticipantService;
  let participantRepository: Repository<EventParticipant>;

  const mockParticipantRepository = {
    create: vi.fn(),
    save: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
    count: vi.fn(),
    remove: vi.fn(),
  };

  const mockStageRepository = {
    findOne: vi.fn(),
  };

  const mockSessionRepository = {
    findOne: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParticipantService,
        {
          provide: getRepositoryToken(EventParticipant),
          useValue: mockParticipantRepository,
        },
        {
          provide: getRepositoryToken(Stage),
          useValue: mockStageRepository,
        },
        {
          provide: getRepositoryToken(EventSession),
          useValue: mockSessionRepository,
        },
      ],
    }).compile();

    service = module.get<ParticipantService>(ParticipantService);
    participantRepository = module.get<Repository<EventParticipant>>(
      getRepositoryToken(EventParticipant),
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a participant', async () => {
      const createDto = {
        eventId: 'event-123',
        sessionId: 'session-123',
        athleteId: 'athlete-123',
      };
      const userId = 'user-123';

      mockParticipantRepository.findOne.mockResolvedValue(null);
      mockParticipantRepository.count.mockResolvedValue(5);
      mockParticipantRepository.create.mockReturnValue({
        ...createDto,
        userId,
        ticketCode: 'TKT-0006',
      });
      mockParticipantRepository.save.mockResolvedValue({
        id: 'participant-123',
        ...createDto,
        userId,
        ticketCode: 'TKT-0006',
        status: ParticipantStatus.REGISTERED,
      });

      const result = await service.create(createDto, userId);

      expect(result.ticketCode).toBe('TKT-0006');
      expect(result.status).toBe(ParticipantStatus.REGISTERED);
      expect(mockParticipantRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if already registered', async () => {
      const createDto = {
        eventId: 'event-123',
        athleteId: 'athlete-123',
      };

      mockParticipantRepository.findOne.mockResolvedValue({
        id: 'existing-123',
      });

      await expect(service.create(createDto, 'user-123')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should generate sequential ticket codes', async () => {
      const createDto = {
        eventId: 'event-123',
        athleteId: 'athlete-123',
      };

      mockParticipantRepository.findOne.mockResolvedValue(null);
      mockParticipantRepository.count.mockResolvedValue(99);
      mockParticipantRepository.create.mockReturnValue({});
      mockParticipantRepository.save.mockResolvedValue({
        ticketCode: 'TKT-0100',
      });

      const result = await service.create(createDto, 'user-123');

      expect(result.ticketCode).toBe('TKT-0100');
    });
  });

  describe('findOne', () => {
    it('should return a participant with relations', async () => {
      const participant = {
        id: 'participant-123',
        eventId: 'event-123',
        athleteId: 'athlete-123',
      };

      mockParticipantRepository.findOne.mockResolvedValue(participant);

      const result = await service.findOne('participant-123');

      expect(result).toEqual(participant);
      expect(mockParticipantRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'participant-123' },
        relations: ['athlete', 'partner', 'session', 'event', 'user'],
      });
    });

    it('should throw NotFoundException if not found', async () => {
      mockParticipantRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('checkin', () => {
    it('should check-in a participant', async () => {
      const participant = {
        id: 'participant-123',
        status: ParticipantStatus.REGISTERED,
        checkinDate: null,
      };

      mockParticipantRepository.findOne.mockResolvedValue(participant);
      mockParticipantRepository.save.mockResolvedValue({
        ...participant,
        status: ParticipantStatus.CHECKED_IN,
        checkinDate: new Date(),
      });

      const result = await service.checkin('participant-123');

      expect(result.status).toBe(ParticipantStatus.CHECKED_IN);
      expect(result.checkinDate).toBeDefined();
    });
  });

  describe('withdraw', () => {
    it('should allow user to withdraw their own registration', async () => {
      const participant = {
        id: 'participant-123',
        userId: 'user-123',
        status: ParticipantStatus.REGISTERED,
      };

      mockParticipantRepository.findOne.mockResolvedValue(participant);
      mockParticipantRepository.save.mockResolvedValue({
        ...participant,
        status: ParticipantStatus.WITHDRAWN,
      });

      const result = await service.withdraw('participant-123', 'user-123');

      expect(result.status).toBe(ParticipantStatus.WITHDRAWN);
    });

    it('should throw ConflictException if user does not own registration', async () => {
      const participant = {
        id: 'participant-123',
        userId: 'user-123',
      };

      mockParticipantRepository.findOne.mockResolvedValue(participant);

      await expect(
        service.withdraw('participant-123', 'different-user'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAllByEvent', () => {
    it('should return all participants for an event', async () => {
      const participants = [
        { id: '1', eventId: 'event-123' },
        { id: '2', eventId: 'event-123' },
      ];

      mockParticipantRepository.find.mockResolvedValue(participants);

      const result = await service.findAllByEvent('event-123');

      expect(result).toEqual(participants);
      expect(mockParticipantRepository.find).toHaveBeenCalledWith({
        where: { eventId: 'event-123' },
        relations: ['athlete', 'partner', 'session', 'user'],
        order: { registrationDate: 'ASC' },
      });
    });
  });

  describe('assignBibNumber', () => {
    it('should assign bib number to participant', async () => {
      const participant = {
        id: 'participant-123',
        bibNumber: null,
      };

      mockParticipantRepository.findOne.mockResolvedValue(participant);
      mockParticipantRepository.save.mockResolvedValue({
        ...participant,
        bibNumber: '001',
      });

      const result = await service.assignBibNumber('participant-123', '001');

      expect(result.bibNumber).toBe('001');
    });
  });

  describe('updateCustomData', () => {
    it('should merge custom data', async () => {
      const participant = {
        id: 'participant-123',
        customData: { tShirtSize: 'M' },
      };

      mockParticipantRepository.findOne.mockResolvedValue(participant);
      mockParticipantRepository.save.mockResolvedValue({
        ...participant,
        customData: {
          tShirtSize: 'M',
          emergencyContact: '+84901234567',
        },
      });

      const result = await service.updateCustomData('participant-123', {
        emergencyContact: '+84901234567',
      });

      expect(result.customData.tShirtSize).toBe('M');
      expect(result.customData.emergencyContact).toBe('+84901234567');
    });
  });

  describe('getCheckedInParticipants', () => {
    it('should return only checked-in participants', async () => {
      const participants = [
        {
          id: '1',
          status: ParticipantStatus.CHECKED_IN,
        },
        {
          id: '2',
          status: ParticipantStatus.CHECKED_IN,
        },
      ];

      mockParticipantRepository.find.mockResolvedValue(participants);

      const result = await service.getCheckedInParticipants('event-123');

      expect(result).toEqual(participants);
      expect(mockParticipantRepository.find).toHaveBeenCalledWith({
        where: {
          eventId: 'event-123',
          status: ParticipantStatus.CHECKED_IN,
        },
        relations: ['athlete', 'partner', 'session'],
      });
    });
  });

  describe('findByAthlete', () => {
    it('should return all registrations for an athlete', async () => {
      const participants = [
        { id: '1', athleteId: 'athlete-123' },
        { id: '2', athleteId: 'athlete-123' },
      ];

      mockParticipantRepository.find.mockResolvedValue(participants);

      const result = await service.findByAthlete('athlete-123');

      expect(result).toEqual(participants);
      expect(mockParticipantRepository.find).toHaveBeenCalledWith({
        where: { athleteId: 'athlete-123' },
        relations: ['event', 'session'],
        order: { registrationDate: 'DESC' },
      });
    });
  });
});
