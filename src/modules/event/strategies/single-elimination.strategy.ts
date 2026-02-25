import { Injectable } from '@nestjs/common';
import { IStageStrategy } from './stage-strategy.interface';
import { Stage } from '../entities/stage.entity';
import { Match } from '../entities/match.entity';
import { EventParticipant } from '../entities/event-participant.entity';
import { StageType } from '../enums/stage-type.enum';

@Injectable()
export class SingleEliminationStrategy implements IStageStrategy {
  getStageType(): StageType {
    return StageType.SINGLE_ELIMINATION;
  }

  generateMatches(
    stage: Stage,
    participants: EventParticipant[],
  ): Partial<Match>[] {
    const matches: Partial<Match>[] = [];
    const n = participants.length;

    // Calculate the next power of 2 for bracket size
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(n)));
    const byeCount = bracketSize - n;
    const totalRounds = Math.log2(bracketSize);

    const roundNames = this.getRoundNames(totalRounds);
    let matchNumber = 1;

    // Generate first round matches
    let participantIndex = 0;
    for (let i = 0; i < bracketSize / 2; i++) {
      const p1 = participants[participantIndex];
      participantIndex++;

      const isBye = i < byeCount;
      const p2 = isBye ? null : participants[participantIndex];
      if (!isBye) participantIndex++;

      matches.push({
        sessionId: stage.sessionId,
        stageId: stage.id,
        name: `${roundNames[0]} - Match ${matchNumber}`,
        matchNumber,
        round: roundNames[0],
        team1Player1Id: p1?.athleteId || null,
        team1Player2Id: p1?.partnerId || null,
        team2Player1Id: p2?.athleteId || null,
        team2Player2Id: p2?.partnerId || null,
        isBye,
        scheduledTime: new Date(),
      });
      matchNumber++;
    }

    // Generate placeholder matches for subsequent rounds
    for (let round = 1; round < totalRounds; round++) {
      const matchesInRound = bracketSize / Math.pow(2, round + 1);
      for (let i = 0; i < matchesInRound; i++) {
        matches.push({
          sessionId: stage.sessionId,
          stageId: stage.id,
          name: `${roundNames[round]} - Match ${matchNumber}`,
          matchNumber,
          round: roundNames[round],
          scheduledTime: new Date(),
        });
        matchNumber++;
      }
    }

    return matches;
  }

  advanceWinners(
    stage: Stage,
    completedMatches: Match[],
  ): Partial<Match>[] {
    // For single elimination, winners advance to next round matches
    // This is handled by updating existing placeholder matches with winner data
    return [];
  }

  private getRoundNames(totalRounds: number): string[] {
    const names: string[] = [];
    for (let i = 0; i < totalRounds; i++) {
      const remaining = totalRounds - i;
      if (remaining === 1) names.push('Final');
      else if (remaining === 2) names.push('Semi Final');
      else if (remaining === 3) names.push('Quarter Final');
      else names.push(`Round of ${Math.pow(2, remaining)}`);
    }
    return names;
  }
}
