import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { AthleteService } from './athlete.service';
import { Athlete, AthleteStats } from './entities';
import { SportType } from '../event/enums/sport-type.enum';

describe('AthleteService', () => {
  let service: AthleteService;
  let athleteRepository: Repository<Athlete>;
  let statsRepository: Repository<AthleteStats>;

  const mockAthleteRepository = {
    create: vi.fn(),
    save: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
    findAndCount: vi.fn(),
    softRemove: vi.fn(),
    createQueryBuilder: vi.fn(),
  };

  const mockStatsRepository = {
    create: vi.fn(),
    save: vi.fn(),
    findOne: vi.fn(),
    createQueryBuilder: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AthleteService,
        {
          provide: getRepositoryToken(Athlete),
          useValue: mockAthleteRepository,
        },
        {
          provide: getRepositoryToken(AthleteStats),
          useValue: mockStatsRepository,
        },
      ],
    }).compile();

    service = module.get<AthleteService>(AthleteService);
    athleteRepository = module.get<Repository<Athlete>>(
      getRepositoryToken(Athlete),
    );
    statsRepository = module.get<Repository<AthleteStats>>(
      getRepositoryToken(AthleteStats),
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new athlete', async () => {
      const createDto = {
        name: 'John Doe',
        sportType: SportType.PICKLEBALL,
        city: 'HCMC',
      };
      const userId = 'user-123';

      mockAthleteRepository.findOne.mockResolvedValue(null);
      mockAthleteRepository.create.mockReturnValue({
        ...createDto,
        userId,
        id: 'athlete-123',
      });
      mockAthleteRepository.save.mockResolvedValue({
        ...createDto,
        userId,
        id: 'athlete-123',
      });

      const result = await service.create(createDto, userId);

      expect(result.name).toBe(createDto.name);
      expect(mockAthleteRepository.findOne).toHaveBeenCalledWith({
        where: {
          userId,
          sportType: createDto.sportType,
        },
      });
      expect(mockAthleteRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if athlete already exists', async () => {
      const createDto = {
        name: 'John Doe',
        sportType: SportType.PICKLEBALL,
      };
      const userId = 'user-123';

      mockAthleteRepository.findOne.mockResolvedValue({
        id: 'existing-athlete',
      });

      await expect(service.create(createDto, userId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findOne', () => {
    it('should return an athlete', async () => {
      const athleteId = 'athlete-123';
      const athlete = {
        id: athleteId,
        name: 'John Doe',
        sportType: SportType.PICKLEBALL,
      };

      mockAthleteRepository.findOne.mockResolvedValue(athlete);

      const result = await service.findOne(athleteId);

      expect(result).toEqual(athlete);
      expect(mockAthleteRepository.findOne).toHaveBeenCalledWith({
        where: { id: athleteId },
        relations: ['user'],
      });
    });

    it('should throw NotFoundException if athlete not found', async () => {
      mockAthleteRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update an athlete', async () => {
      const athleteId = 'athlete-123';
      const userId = 'user-123';
      const updateDto = { name: 'Jane Doe' };
      const athlete = {
        id: athleteId,
        userId,
        name: 'John Doe',
        sportType: SportType.PICKLEBALL,
      };

      mockAthleteRepository.findOne.mockResolvedValue(athlete);
      mockAthleteRepository.save.mockResolvedValue({
        ...athlete,
        ...updateDto,
      });

      const result = await service.update(athleteId, updateDto, userId);

      expect(result.name).toBe(updateDto.name);
      expect(mockAthleteRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user does not own athlete', async () => {
      const athleteId = 'athlete-123';
      const userId = 'user-123';
      const updateDto = { name: 'Jane Doe' };
      const athlete = {
        id: athleteId,
        userId: 'different-user',
        name: 'John Doe',
      };

      mockAthleteRepository.findOne.mockResolvedValue(athlete);

      await expect(
        service.update(athleteId, updateDto, userId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateStatsAfterMatch', () => {
    it('should update athlete stats after a win', async () => {
      const athleteId = 'athlete-123';
      const athlete = {
        id: athleteId,
        totalMatches: 10,
        wins: 6,
        losses: 4,
        currentRating: 4.5,
        peakRating: 4.8,
        winRate: 60,
      };

      mockAthleteRepository.findOne.mockResolvedValue(athlete);
      mockAthleteRepository.save.mockResolvedValue({
        ...athlete,
        totalMatches: 11,
        wins: 7,
        winRate: 63.64,
      });
      mockStatsRepository.findOne.mockResolvedValue(null);
      mockStatsRepository.create.mockReturnValue({});
      mockStatsRepository.save.mockResolvedValue({});

      await service.updateStatsAfterMatch(athleteId, true, 4.6);

      expect(mockAthleteRepository.save).toHaveBeenCalled();
      expect(mockStatsRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated athletes', async () => {
      const query = {
        page: 1,
        limit: 10,
        sportType: SportType.PICKLEBALL,
      };

      const athletes = [
        { id: '1', name: 'Athlete 1' },
        { id: '2', name: 'Athlete 2' },
      ];

      mockAthleteRepository.findAndCount.mockResolvedValue([athletes, 2]);

      const result = await service.findAll(query);

      expect(result.data).toEqual(athletes);
      expect(result.meta.total).toBe(2);
      expect(result.meta.totalPages).toBe(1);
    });
  });

  describe('search', () => {
    it('should search athletes by name', async () => {
      const queryBuilder: any = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([{ id: '1', name: 'John' }]),
      };

      mockAthleteRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.search('John', SportType.PICKLEBALL);

      expect(result).toHaveLength(1);
      expect(queryBuilder.andWhere).toHaveBeenCalled();
    });
  });
});
