import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match, MatchScore, EventParticipant } from './entities';
import { CreateMatchDto, UpdateMatchDto, UpdateScoreDto } from './dto/match';
import { MatchStatus } from './entities/match.entity';

@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(MatchScore)
    private readonly scoreRepository: Repository<MatchScore>,
  ) {}

  async create(eventId: string, createMatchDto: CreateMatchDto): Promise<Match> {
    const match = this.matchRepository.create(createMatchDto);
    return await this.matchRepository.save(match);
  }

  async findAllByEvent(eventId: string): Promise<Match[]> {
    return await this.matchRepository
      .createQueryBuilder('match')
      .leftJoin('match.session', 'session')
      .leftJoin('session.event', 'event')
      .where('event.id = :eventId', { eventId })
      .orderBy('match.scheduledTime', 'ASC')
      .getMany();
  }

  async findOne(id: string): Promise<Match> {
    const match = await this.matchRepository.findOne({
      where: { id },
      relations: ['session', 'scores'],
    });

    if (!match) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }

    return match;
  }

  async update(id: string, updateMatchDto: UpdateMatchDto): Promise<Match> {
    const match = await this.findOne(id);
    Object.assign(match, updateMatchDto);
    return await this.matchRepository.save(match);
  }

  async remove(id: string): Promise<void> {
    const match = await this.findOne(id);
    await this.matchRepository.remove(match);
  }

  async startMatch(id: string): Promise<Match> {
    const match = await this.findOne(id);

    if (
      match.status !== MatchStatus.SCHEDULED &&
      match.status !== MatchStatus.WARM_UP
    ) {
      throw new BadRequestException(
        'Match can only be started from SCHEDULED or WARM_UP status',
      );
    }

    match.status = MatchStatus.IN_PROGRESS;
    match.startTime = new Date();

    return await this.matchRepository.save(match);
  }

  async endMatch(id: string, winnerTeam?: number): Promise<Match> {
    const match = await this.findOne(id);
    
    if (match.status !== MatchStatus.IN_PROGRESS) {
      throw new BadRequestException('Match can only be ended from IN_PROGRESS status');
    }

    match.status = MatchStatus.COMPLETED;
    match.endTime = new Date();
    
    if (winnerTeam) {
      match.winnerTeam = winnerTeam;
    }
    
    return await this.matchRepository.save(match);
  }

  async updateScore(matchId: string, updateScoreDto: UpdateScoreDto): Promise<MatchScore> {
    // Check if score for this set already exists
    let score = await this.scoreRepository.findOne({
      where: {
        matchId,
        setNumber: updateScoreDto.setNumber,
      },
    });

    if (score) {
      // Update existing score
      Object.assign(score, updateScoreDto);
    } else {
      // Create new score
      score = this.scoreRepository.create({
        matchId,
        ...updateScoreDto,
      });
    }

    const savedScore = await this.scoreRepository.save(score);

    // Update match aggregate scores
    await this.updateMatchAggregateScores(matchId);

    return savedScore;
  }

  private async updateMatchAggregateScores(matchId: string): Promise<void> {
    const scores = await this.scoreRepository.find({
      where: { matchId },
      order: { setNumber: 'ASC' },
    });

    const match = await this.findOne(matchId);

    const team1Sets = scores.map(s => s.team1Points);
    const team2Sets = scores.map(s => s.team2Points);

    match.team1Score = {
      sets: team1Sets,
      setsWon: scores.filter(s => s.winnerTeam === 1).length,
      total: team1Sets.reduce((a, b) => a + b, 0),
    };

    match.team2Score = {
      sets: team2Sets,
      setsWon: scores.filter(s => s.winnerTeam === 2).length,
      total: team2Sets.reduce((a, b) => a + b, 0),
    };

    // Determine overall winner based on sets won
    if (match.team1Score.setsWon > match.team2Score.setsWon) {
      match.winnerTeam = 1;
    } else if (match.team2Score.setsWon > match.team1Score.setsWon) {
      match.winnerTeam = 2;
    }

    await this.matchRepository.save(match);
  }

  async getScores(matchId: string): Promise<MatchScore[]> {
    return await this.scoreRepository.find({
      where: { matchId },
      order: { setNumber: 'ASC' },
    });
  }

  async getMatchesBySession(sessionId: string): Promise<Match[]> {
    return await this.matchRepository.find({
      where: { sessionId },
      order: { scheduledTime: 'ASC' },
    });
  }

  async findAllByStage(stageId: string): Promise<Match[]> {
    return await this.matchRepository.find({
      where: { stageId },
      order: { matchNumber: 'ASC' },
    });
  }
}
