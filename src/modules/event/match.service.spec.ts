import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MatchService } from './match.service';
import { Match, MatchScore } from './entities';
import { MatchStatus } from './entities/match.entity';

describe('MatchService', () => {
  let service: MatchService;
  let matchRepository: Repository<Match>;
  let scoreRepository: Repository<MatchScore>;

  const mockMatchRepository = {
    create: vi.fn(),
    save: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
    remove: vi.fn(),
    createQueryBuilder: vi.fn(),
  };

  const mockScoreRepository = {
    create: vi.fn(),
    save: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchService,
        {
          provide: getRepositoryToken(Match),
          useValue: mockMatchRepository,
        },
        {
          provide: getRepositoryToken(MatchScore),
          useValue: mockScoreRepository,
        },
      ],
    }).compile();

    service = module.get<MatchService>(MatchService);
    matchRepository = module.get<Repository<Match>>(getRepositoryToken(Match));
    scoreRepository = module.get<Repository<MatchScore>>(
      getRepositoryToken(MatchScore),
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a match', async () => {
      const createDto = {
        sessionId: 'session-123',
        name: 'Quarter Final 1',
        scheduledTime: '2024-02-20T09:00:00Z',
        courtNumber: 1,
      };

      const eventId = 'event-123';

      mockMatchRepository.create.mockReturnValue(createDto);
      mockMatchRepository.save.mockResolvedValue({
        id: 'match-123',
        ...createDto,
      });

      const result = await service.create(eventId, createDto);

      expect(result.name).toBe(createDto.name);
      expect(mockMatchRepository.save).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a match', async () => {
      const match = {
        id: 'match-123',
        name: 'Quarter Final 1',
        status: MatchStatus.SCHEDULED,
      };

      mockMatchRepository.findOne.mockResolvedValue(match);

      const result = await service.findOne('match-123');

      expect(result).toEqual(match);
      expect(mockMatchRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'match-123' },
        relations: ['session', 'scores'],
      });
    });

    it('should throw NotFoundException if not found', async () => {
      mockMatchRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('startMatch', () => {
    it('should start a scheduled match', async () => {
      const match = {
        id: 'match-123',
        status: MatchStatus.SCHEDULED,
        startTime: null,
      };

      mockMatchRepository.findOne.mockResolvedValue(match);
      mockMatchRepository.save.mockResolvedValue({
        ...match,
        status: MatchStatus.IN_PROGRESS,
        startTime: new Date(),
      });

      const result = await service.startMatch('match-123');

      expect(result.status).toBe(MatchStatus.IN_PROGRESS);
      expect(result.startTime).toBeDefined();
    });

    it('should throw BadRequestException if not scheduled', async () => {
      const match = {
        id: 'match-123',
        status: MatchStatus.IN_PROGRESS,
      };

      mockMatchRepository.findOne.mockResolvedValue(match);

      await expect(service.startMatch('match-123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('endMatch', () => {
    it('should end an in-progress match', async () => {
      const match = {
        id: 'match-123',
        status: MatchStatus.IN_PROGRESS,
        endTime: null,
        winnerTeam: null,
      };

      mockMatchRepository.findOne.mockResolvedValue(match);
      mockMatchRepository.save.mockResolvedValue({
        ...match,
        status: MatchStatus.COMPLETED,
        endTime: new Date(),
        winnerTeam: 1,
      });

      const result = await service.endMatch('match-123', 1);

      expect(result.status).toBe(MatchStatus.COMPLETED);
      expect(result.endTime).toBeDefined();
      expect(result.winnerTeam).toBe(1);
    });

    it('should throw BadRequestException if not in progress', async () => {
      const match = {
        id: 'match-123',
        status: MatchStatus.SCHEDULED,
      };

      mockMatchRepository.findOne.mockResolvedValue(match);

      await expect(service.endMatch('match-123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateScore', () => {
    it('should create new score if not exists', async () => {
      const matchId = 'match-123';
      const updateDto = {
        setNumber: 1,
        team1Points: 21,
        team2Points: 19,
        winnerTeam: 1,
      };

      mockScoreRepository.findOne.mockResolvedValue(null);
      mockScoreRepository.create.mockReturnValue(updateDto);
      mockScoreRepository.save.mockResolvedValue({
        id: 'score-123',
        matchId,
        ...updateDto,
      });

      // Mock for updateMatchAggregateScores
      mockScoreRepository.find.mockResolvedValue([
        { setNumber: 1, team1Points: 21, team2Points: 19, winnerTeam: 1 },
      ]);
      mockMatchRepository.findOne.mockResolvedValue({
        id: matchId,
        team1Score: null,
        team2Score: null,
      });
      mockMatchRepository.save.mockResolvedValue({});

      const result = await service.updateScore(matchId, updateDto);

      expect(mockScoreRepository.create).toHaveBeenCalled();
      expect(mockScoreRepository.save).toHaveBeenCalled();
    });

    it('should update existing score', async () => {
      const existingScore = {
        id: 'score-123',
        matchId: 'match-123',
        setNumber: 1,
        team1Points: 20,
        team2Points: 18,
      };

      const updateDto = {
        setNumber: 1,
        team1Points: 21,
        team2Points: 19,
        winnerTeam: 1,
      };

      mockScoreRepository.findOne.mockResolvedValue(existingScore);
      mockScoreRepository.save.mockResolvedValue({
        ...existingScore,
        ...updateDto,
      });

      // Mock for updateMatchAggregateScores
      mockScoreRepository.find.mockResolvedValue([
        { setNumber: 1, team1Points: 21, team2Points: 19, winnerTeam: 1 },
      ]);
      mockMatchRepository.findOne.mockResolvedValue({
        id: 'match-123',
        team1Score: null,
        team2Score: null,
      });
      mockMatchRepository.save.mockResolvedValue({});

      const result = await service.updateScore('match-123', updateDto);

      expect(result.team1Points).toBe(21);
      expect(result.team2Points).toBe(19);
    });
  });

  describe('getScores', () => {
    it('should return match scores ordered by set', async () => {
      const scores = [
        { id: '1', setNumber: 1, team1Points: 21, team2Points: 19 },
        { id: '2', setNumber: 2, team1Points: 19, team2Points: 21 },
        { id: '3', setNumber: 3, team1Points: 21, team2Points: 18 },
      ];

      mockScoreRepository.find.mockResolvedValue(scores);

      const result = await service.getScores('match-123');

      expect(result).toEqual(scores);
      expect(mockScoreRepository.find).toHaveBeenCalledWith({
        where: { matchId: 'match-123' },
        order: { setNumber: 'ASC' },
      });
    });
  });

  describe('findAllByEvent', () => {
    it('should return all matches for an event', async () => {
      const matches = [
        { id: '1', name: 'Match 1' },
        { id: '2', name: 'Match 2' },
      ];

      const queryBuilder: any = {
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(matches),
      };

      mockMatchRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.findAllByEvent('event-123');

      expect(result).toEqual(matches);
      expect(queryBuilder.where).toHaveBeenCalledWith('event.id = :eventId', {
        eventId: 'event-123',
      });
    });
  });
});
