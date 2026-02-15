import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { Leaderboard, LeaderboardEntry } from './entities';
import { Athlete } from '../athlete/entities';
import { LeaderboardType } from './enums/leaderboard-type.enum';
import { SportType } from '../event/enums/sport-type.enum';

describe('LeaderboardService', () => {
  let service: LeaderboardService;
  let leaderboardRepository: Repository<Leaderboard>;
  let entryRepository: Repository<LeaderboardEntry>;
  let athleteRepository: Repository<Athlete>;

  const mockLeaderboardRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    remove: jest.fn(),
  };

  const mockEntryRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    remove: jest.fn(),
  };

  const mockAthleteRepository = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaderboardService,
        {
          provide: getRepositoryToken(Leaderboard),
          useValue: mockLeaderboardRepository,
        },
        {
          provide: getRepositoryToken(LeaderboardEntry),
          useValue: mockEntryRepository,
        },
        {
          provide: getRepositoryToken(Athlete),
          useValue: mockAthleteRepository,
        },
      ],
    }).compile();

    service = module.get<LeaderboardService>(LeaderboardService);
    leaderboardRepository = module.get<Repository<Leaderboard>>(
      getRepositoryToken(Leaderboard),
    );
    entryRepository = module.get<Repository<LeaderboardEntry>>(
      getRepositoryToken(LeaderboardEntry),
    );
    athleteRepository = module.get<Repository<Athlete>>(
      getRepositoryToken(Athlete),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a leaderboard', async () => {
      const createDto = {
        name: 'January 2024',
        type: LeaderboardType.MONTHLY,
        sportType: SportType.PICKLEBALL,
        startDate: '2024-01-01',
      };

      mockLeaderboardRepository.create.mockReturnValue(createDto);
      mockLeaderboardRepository.save.mockResolvedValue({
        id: 'leaderboard-123',
        ...createDto,
      });

      const result = await service.create(createDto);

      expect(result.name).toBe(createDto.name);
      expect(mockLeaderboardRepository.save).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a leaderboard with entries', async () => {
      const leaderboard = {
        id: 'leaderboard-123',
        name: 'Test Leaderboard',
        entries: [
          { id: 'entry-1', rank: 2, score: 1400 },
          { id: 'entry-2', rank: 1, score: 1500 },
        ],
      };

      mockLeaderboardRepository.findOne.mockResolvedValue(leaderboard);

      const result = await service.findOne('leaderboard-123');

      expect(result).toBeDefined();
      expect(result.entries[0].rank).toBe(1); // Should be sorted
      expect(result.entries[1].rank).toBe(2);
    });

    it('should throw NotFoundException if not found', async () => {
      mockLeaderboardRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('calculateRankings', () => {
    it('should calculate rankings based on score', async () => {
      const leaderboard = {
        id: 'leaderboard-123',
        name: 'Test',
      };

      const entries = [
        { id: '1', score: 1200, rank: 3, previousRank: null },
        { id: '2', score: 1500, rank: 1, previousRank: null },
        { id: '3', score: 1350, rank: 2, previousRank: null },
      ];

      mockLeaderboardRepository.findOne.mockResolvedValue(leaderboard);
      mockEntryRepository.find.mockResolvedValue(entries);
      mockEntryRepository.save.mockImplementation((entries) =>
        Promise.resolve(entries),
      );

      const result = await service.calculateRankings('leaderboard-123');

      expect(result[0].rank).toBe(1); // Highest score
      expect(result[0].previousRank).toBe(1); // Previous was 1
      expect(result[1].rank).toBe(2);
      expect(result[2].rank).toBe(3);
    });
  });

  describe('addOrUpdateEntry', () => {
    it('should create new entry if not exists', async () => {
      const leaderboardId = 'leaderboard-123';
      const athleteId = 'athlete-123';
      const score = 1500;

      mockEntryRepository.findOne.mockResolvedValue(null);
      mockEntryRepository.create.mockReturnValue({
        leaderboardId,
        athleteId,
        score,
        rank: 9999,
      });
      mockEntryRepository.save.mockResolvedValue({
        id: 'entry-123',
        leaderboardId,
        athleteId,
        score,
        rank: 1,
      });

      // Mock calculateRankings
      const leaderboard = { id: leaderboardId, entries: [] };
      mockLeaderboardRepository.findOne.mockResolvedValue(leaderboard);
      mockEntryRepository.find.mockResolvedValue([]);

      const result = await service.addOrUpdateEntry(
        leaderboardId,
        athleteId,
        score,
      );

      expect(mockEntryRepository.create).toHaveBeenCalled();
      expect(mockEntryRepository.save).toHaveBeenCalled();
    });

    it('should update existing entry', async () => {
      const existingEntry = {
        id: 'entry-123',
        leaderboardId: 'leaderboard-123',
        athleteId: 'athlete-123',
        score: 1400,
        matchesPlayed: 10,
        wins: 6,
        losses: 4,
        winRate: 60,
      };

      mockEntryRepository.findOne.mockResolvedValue(existingEntry);
      mockEntryRepository.save.mockResolvedValue({
        ...existingEntry,
        score: 1500,
        matchesPlayed: 11,
        wins: 7,
        winRate: 63.64,
      });

      // Mock calculateRankings
      const leaderboard = { id: 'leaderboard-123', entries: [] };
      mockLeaderboardRepository.findOne.mockResolvedValue(leaderboard);
      mockEntryRepository.find.mockResolvedValue([]);

      const result = await service.addOrUpdateEntry(
        'leaderboard-123',
        'athlete-123',
        1500,
        { matchesPlayed: 1, wins: 1, losses: 0 },
      );

      expect(result.matchesPlayed).toBe(11);
      expect(result.wins).toBe(7);
    });
  });

  describe('getTopAthletes', () => {
    it('should return top athletes for a sport', async () => {
      const leaderboard = {
        id: 'leaderboard-123',
        type: LeaderboardType.OVERALL,
        sportType: SportType.PICKLEBALL,
      };

      const entries = [
        { id: '1', rank: 1, score: 1500 },
        { id: '2', rank: 2, score: 1450 },
        { id: '3', rank: 3, score: 1400 },
      ];

      mockLeaderboardRepository.findOne.mockResolvedValue(leaderboard);
      mockEntryRepository.find.mockResolvedValue(entries);

      const result = await service.getTopAthletes(
        SportType.PICKLEBALL,
        10,
      );

      expect(result).toHaveLength(3);
      expect(result[0].rank).toBe(1);
    });

    it('should return empty array if no leaderboard exists', async () => {
      mockLeaderboardRepository.findOne.mockResolvedValue(null);

      const result = await service.getTopAthletes(
        SportType.PICKLEBALL,
        10,
      );

      expect(result).toEqual([]);
    });
  });
});
