import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stage } from './entities/stage.entity';
import { Match } from './entities/match.entity';
import { EventSession } from './entities/event-session.entity';
import { EventParticipant } from './entities/event-participant.entity';
import { CreateStageDto } from './dto/stage/create-stage.dto';
import { UpdateStageDto } from './dto/stage/update-stage.dto';
import { StageStatus } from './enums/stage-status.enum';
import { StageFactory } from './strategies/stage.factory';
import { ParticipantStatus } from './entities/event-participant.entity';

@Injectable()
export class StageService {
  constructor(
    @InjectRepository(Stage)
    private readonly stageRepository: Repository<Stage>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(EventSession)
    private readonly sessionRepository: Repository<EventSession>,
    @InjectRepository(EventParticipant)
    private readonly participantRepository: Repository<EventParticipant>,
    private readonly stageFactory: StageFactory,
  ) {}

  async create(sessionId: string, dto: CreateStageDto): Promise<Stage> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    const stage = this.stageRepository.create({
      sessionId,
      ...dto,
    });

    return await this.stageRepository.save(stage);
  }

  async findAllBySession(sessionId: string): Promise<Stage[]> {
    return await this.stageRepository.find({
      where: { sessionId },
      order: { sortOrder: 'ASC' },
      relations: ['matches'],
    });
  }

  async findOne(id: string): Promise<Stage> {
    const stage = await this.stageRepository.findOne({
      where: { id },
      relations: ['session', 'matches', 'matches.scores'],
    });

    if (!stage) {
      throw new NotFoundException(`Stage with ID ${id} not found`);
    }

    return stage;
  }

  async update(id: string, dto: UpdateStageDto): Promise<Stage> {
    const stage = await this.findOne(id);
    Object.assign(stage, dto);
    return await this.stageRepository.save(stage);
  }

  async remove(id: string): Promise<void> {
    const stage = await this.findOne(id);
    await this.stageRepository.remove(stage);
  }

  async findMatchesByStage(stageId: string): Promise<Match[]> {
    await this.findOne(stageId); // ensure stage exists
    return await this.matchRepository.find({
      where: { stageId },
      relations: ['team1Player1', 'team2Player1'],
      order: { matchNumber: 'ASC' },
    });
  }

  async generateMatches(stageId: string): Promise<Match[]> {
    const stage = await this.findOne(stageId);

    if (stage.status !== StageStatus.DRAFT) {
      throw new BadRequestException(
        'Matches can only be generated for stages in DRAFT status',
      );
    }

    // Get registered participants for this session
    const participants = await this.participantRepository.find({
      where: {
        sessionId: stage.sessionId,
        status: ParticipantStatus.REGISTERED,
      },
    });

    if (participants.length < 2) {
      throw new BadRequestException(
        'At least 2 participants are required to generate matches',
      );
    }

    // Use strategy pattern to generate matches
    const strategy = this.stageFactory.getStrategy(stage.stageType);
    const matchData = strategy.generateMatches(stage, participants);

    console.log('Generated matches:', matchData);

    // Save generated matches — use plain stage reference to avoid TypeORM relation graph issues
    const matches = this.matchRepository.create(
      matchData.map((m) => ({ ...m, stage: { id: stage.id } as Stage })),
    );
    const savedMatches = await this.matchRepository.save(matches);

    // Update stage status to READY — use update() to avoid TypeORM reconciling the matches relation
    await this.stageRepository.update(stage.id, { status: StageStatus.READY });

    return savedMatches;
  }

  async advanceWinners(stageId: string): Promise<Match[]> {
    const stage = await this.findOne(stageId);

    if (stage.status !== StageStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Can only advance winners for stages in IN_PROGRESS status',
      );
    }

    const completedMatches = stage.matches.filter(
      (m) => m.status === 'COMPLETED',
    );

    const strategy = this.stageFactory.getStrategy(stage.stageType);
    const newMatchData = strategy.advanceWinners(stage, completedMatches);

    if (newMatchData.length === 0) {
      return [];
    }

    const matches = this.matchRepository.create(newMatchData);
    return await this.matchRepository.save(matches);
  }
}
