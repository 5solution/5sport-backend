import { Injectable } from '@nestjs/common';
import { IStageStrategy } from './stage-strategy.interface';
import { Stage } from '../entities/stage.entity';
import { Match } from '../entities/match.entity';
import { EventParticipant } from '../entities/event-participant.entity';
import { StageType } from '../enums/stage-type.enum';

@Injectable()
export class DoubleEliminationStrategy implements IStageStrategy {
  getStageType(): StageType {
    return StageType.DOUBLE_ELIMINATION;
  }

  generateMatches(
    stage: Stage,
    participants: EventParticipant[],
  ): Partial<Match>[] {
    const matches: Partial<Match>[] = [];
    const n = participants.length;
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(n)));
    const winnersRounds = Math.log2(bracketSize);
    const losersRounds = (winnersRounds - 1) * 2;

    let matchNumber = 1;

    // === Winners Bracket - First Round ===
    let participantIndex = 0;
    const byeCount = bracketSize - n;

    for (let i = 0; i < bracketSize / 2; i++) {
      const p1 = participants[participantIndex];
      participantIndex++;

      const isBye = i < byeCount;
      const p2 = isBye ? null : participants[participantIndex];
      if (!isBye) participantIndex++;

      matches.push({
        sessionId: stage.sessionId,
        stageId: stage.id,
        name: `Winners R1 - Match ${matchNumber}`,
        matchNumber,
        round: 'Winners Round 1',
        bracketType: 'WINNERS',
        team1Player1Id: p1?.athleteId || null,
        team1Player2Id: p1?.partnerId || null,
        team2Player1Id: p2?.athleteId || null,
        team2Player2Id: p2?.partnerId || null,
        isBye,
        scheduledTime: new Date(),
      });
      matchNumber++;
    }

    // === Winners Bracket - Subsequent Rounds ===
    for (let round = 2; round <= winnersRounds; round++) {
      const matchesInRound = bracketSize / Math.pow(2, round);
      for (let i = 0; i < matchesInRound; i++) {
        matches.push({
          sessionId: stage.sessionId,
          stageId: stage.id,
          name: `Winners R${round} - Match ${matchNumber}`,
          matchNumber,
          round: `Winners Round ${round}`,
          bracketType: 'WINNERS',
          scheduledTime: new Date(),
        });
        matchNumber++;
      }
    }

    // === Losers Bracket Rounds ===
    for (let round = 1; round <= losersRounds; round++) {
      // Losers bracket has fewer matches per round
      const matchesInRound = Math.max(
        1,
        Math.floor(bracketSize / Math.pow(2, Math.ceil(round / 2) + 1)),
      );
      for (let i = 0; i < matchesInRound; i++) {
        matches.push({
          sessionId: stage.sessionId,
          stageId: stage.id,
          name: `Losers R${round} - Match ${matchNumber}`,
          matchNumber,
          round: `Losers Round ${round}`,
          bracketType: 'LOSERS',
          scheduledTime: new Date(),
        });
        matchNumber++;
      }
    }

    // === Grand Final ===
    matches.push({
      sessionId: stage.sessionId,
      stageId: stage.id,
      name: `Grand Final - Match ${matchNumber}`,
      matchNumber,
      round: 'Grand Final',
      bracketType: 'WINNERS',
      scheduledTime: new Date(),
    });

    return matches;
  }

  advanceWinners(
    stage: Stage,
    completedMatches: Match[],
  ): Partial<Match>[] {
    // Winners advance in winners bracket, losers drop to losers bracket
    // Handled by updating existing placeholder matches
    return [];
  }
}
