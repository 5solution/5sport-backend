import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntityWithoutId } from 'src/utils/base/base-entity';
import { Match } from './match.entity';

@Entity('match_scores')
@Index(['matchId', 'setNumber'], { unique: true })
export class MatchScore extends BaseEntityWithoutId {
  @ApiProperty({
    description: 'Score record ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Match ID' })
  @Column({ name: 'match_id' })
  @Index()
  matchId: string;

  @ApiProperty({ description: 'Match relationship', type: () => Match })
  @ManyToOne(() => Match, (match) => match.scores, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @ApiProperty({
    description: 'Set number',
    example: 1,
  })
  @Column({ name: 'set_number' })
  setNumber: number;

  @ApiProperty({
    description: 'Team 1 points in this set',
    example: 21,
  })
  @Column({ name: 'team1_points' })
  team1Points: number;

  @ApiProperty({
    description: 'Team 2 points in this set',
    example: 19,
  })
  @Column({ name: 'team2_points' })
  team2Points: number;

  @ApiPropertyOptional({
    description: 'Winner team for this set (1 or 2)',
    example: 1,
  })
  @Column({ name: 'winner_team', nullable: true })
  winnerTeam: number;

  @ApiPropertyOptional({
    description: 'Point-by-point details',
    example: { points: [{ team: 1, score: [1, 0] }] },
  })
  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, any>;
}
