import { Injectable } from '@nestjs/common';
import { IStageStrategy } from './stage-strategy.interface';
import { Stage } from '../entities/stage.entity';
import { Match } from '../entities/match.entity';
import { EventParticipant } from '../entities/event-participant.entity';
import { StageType } from '../enums/stage-type.enum';

@Injectable()
export class FlexStrategy implements IStageStrategy {
  getStageType(): StageType {
    return StageType.FLEX;
  }

  generateMatches(
    _stage: Stage,
    _participants: EventParticipant[],
  ): Partial<Match>[] {
    // Flex mode: organizer manually creates matches
    return [];
  }

  advanceWinners(
    _stage: Stage,
    _completedMatches: Match[],
  ): Partial<Match>[] {
    // Flex mode: organizer manually manages advancement
    return [];
  }
}
