import { Injectable } from '@nestjs/common';
import { IStageStrategy } from './stage-strategy.interface';
import { Stage } from '../entities/stage.entity';
import { Match } from '../entities/match.entity';
import { EventParticipant } from '../entities/event-participant.entity';
import { StageType } from '../enums/stage-type.enum';

@Injectable()
export class RoundRobinPlayoffStrategy implements IStageStrategy {
  getStageType(): StageType {
    return StageType.ROUND_ROBIN_PLAYOFF;
  }

  generateMatches(
    stage: Stage,
    participants: EventParticipant[],
  ): Partial<Match>[] {
    const config = stage.config || {};
    const groupCount = config.groupCount || 2;
    const matches: Partial<Match>[] = [];

    // Distribute participants into groups
    const groups: EventParticipant[][] = Array.from(
      { length: groupCount },
      () => [],
    );
    participants.forEach((p, i) => {
      groups[i % groupCount].push(p);
    });

    let matchNumber = 1;

    // Generate round-robin matches within each group
    for (let g = 0; g < groups.length; g++) {
      const group = groups[g];
      const groupName = `Group ${String.fromCharCode(65 + g)}`;

      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          matches.push({
            sessionId: stage.sessionId,
            stageId: stage.id,
            stage: stage, 
            name: `${groupName} - Match ${matchNumber}`,
            matchNumber: matchNumber,
            round: 'Group Stage',
            groupName,
            team1Player1Id: group[i].athleteId,
            team1Player2Id: group[i].partnerId || null,
            team2Player1Id: group[j].athleteId,
            team2Player2Id: group[j].partnerId || null,
            scheduledTime: new Date(),
          });
          matchNumber++;
        }
      }
    }

    return matches;
  }

  advanceWinners(
    stage: Stage,
    completedMatches: Match[],
  ): Partial<Match>[] {
    const config = stage.config || {};
    const advancePerGroup = config.advancePerGroup || 2;

    // Group matches by groupName
    const groupMatches = new Map<string, Match[]>();
    for (const match of completedMatches) {
      const group = match.groupName || 'Unknown';
      if (!groupMatches.has(group)) {
        groupMatches.set(group, []);
      }
      groupMatches.get(group).push(match);
    }

    // Calculate standings per group and build playoff bracket
    const qualifiedPlayers: string[] = [];

    for (const [, matches] of groupMatches) {
      const wins = new Map<string, number>();

      for (const match of matches) {
        const winnerId =
          match.winnerTeam === 1
            ? match.team1Player1Id
            : match.team2Player1Id;
        if (winnerId) {
          wins.set(winnerId, (wins.get(winnerId) || 0) + 1);
        }
      }

      const sorted = [...wins.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, advancePerGroup);

      qualifiedPlayers.push(...sorted.map(([id]) => id));
    }

    // Generate single elimination playoff matches
    const playoffMatches: Partial<Match>[] = [];
    for (let i = 0; i < qualifiedPlayers.length; i += 2) {
      if (i + 1 < qualifiedPlayers.length) {
        playoffMatches.push({
          sessionId: stage.sessionId,
          stageId: stage.id,
          stage: stage,
          name: `Playoff - Match ${i / 2 + 1}`,
          matchNumber: i / 2 + 1,
          round: 'Playoff',
          team1Player1Id: qualifiedPlayers[i],
          team2Player1Id: qualifiedPlayers[i + 1],
          scheduledTime: new Date(),
        });
      }
    }

    return playoffMatches;
  }
}
