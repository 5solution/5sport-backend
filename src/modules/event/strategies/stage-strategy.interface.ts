import { Stage } from '../entities/stage.entity';
import { Match } from '../entities/match.entity';
import { EventParticipant } from '../entities/event-participant.entity';
import { StageType } from '../enums/stage-type.enum';

export interface IStageStrategy {
  /**
   * Generate matches for a stage based on participants
   */
  generateMatches(
    stage: Stage,
    participants: EventParticipant[],
  ): Partial<Match>[];

  /**
   * Advance winners after matches are completed
   */
  advanceWinners(
    stage: Stage,
    completedMatches: Match[],
  ): Partial<Match>[];

  /**
   * Get the stage type this strategy handles
   */
  getStageType(): StageType;
}
