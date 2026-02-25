import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntityWithoutId } from 'src/utils/base/base-entity';
import { EventSession } from './event-session.entity';
import { Stage } from './stage.entity';
import { Athlete } from 'src/modules/athlete/entities/athlete.entity';
import { MatchScore } from './match-score.entity';

export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('matches')
export class Match extends BaseEntityWithoutId {
  @ApiProperty({
    description: 'Match unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Event session ID' })
  @Column({ name: 'session_id' })
  @Index()
  sessionId: string;

  @ApiProperty({
    description: 'Event session relationship',
    type: () => EventSession,
  })
  @ManyToOne(() => EventSession)
  @JoinColumn({ name: 'session_id' })
  session: EventSession;

  @ApiPropertyOptional({ description: 'Stage ID' })
  @Column({ name: 'stage_id', nullable: true })
  @Index()
  stageId: string;

  @ApiPropertyOptional({
    description: 'Stage relationship',
    type: () => Stage,
  })
  @ManyToOne(() => Stage, (stage) => stage.matches, { nullable: true })
  @JoinColumn({ name: 'stage_id' })
  stage: Stage;

  @ApiPropertyOptional({
    description: 'Bracket type (for Double Elimination)',
    example: 'WINNERS',
  })
  @Column({ name: 'bracket_type', length: 50, nullable: true })
  bracketType: string;

  @ApiPropertyOptional({
    description: 'Group name (for Round Robin)',
    example: 'Group A',
  })
  @Column({ name: 'group_name', length: 50, nullable: true })
  groupName: string;

  @ApiProperty({
    description: 'Match name',
    example: 'Quarter Final 1',
  })
  @Column({ length: 256 })
  name: string;

  @ApiPropertyOptional({
    description: 'Match number',
    example: 1,
  })
  @Column({ name: 'match_number', nullable: true })
  matchNumber: number;

  @ApiPropertyOptional({
    description: 'Round name',
    example: 'Quarter Final',
  })
  @Column({ length: 50, nullable: true })
  round: string;

  @ApiPropertyOptional({
    description: 'Court number',
    example: 1,
  })
  @Column({ name: 'court_number', nullable: true })
  courtNumber: number;

  @ApiProperty({
    description: 'Scheduled time',
    example: '2024-02-20T09:00:00Z',
  })
  @Column({ name: 'scheduled_time', type: 'timestamp' })
  @Index()
  scheduledTime: Date;

  @ApiPropertyOptional({
    description: 'Start time',
    example: '2024-02-20T09:05:00Z',
  })
  @Column({ name: 'start_time', type: 'timestamp', nullable: true })
  startTime: Date;

  @ApiPropertyOptional({
    description: 'End time',
    example: '2024-02-20T10:30:00Z',
  })
  @Column({ name: 'end_time', type: 'timestamp', nullable: true })
  endTime: Date;

  @ApiProperty({
    description: 'Match status',
    enum: MatchStatus,
    example: MatchStatus.SCHEDULED,
  })
  @Column({ type: 'enum', enum: MatchStatus, default: MatchStatus.SCHEDULED })
  @Index()
  status: MatchStatus;

  @ApiPropertyOptional({ description: 'Team 1 Player 1 ID' })
  @Column({ name: 'team1_player1_id', nullable: true })
  team1Player1Id: string;

  @ApiPropertyOptional({ description: 'Team 1 Player 2 ID' })
  @Column({ name: 'team1_player2_id', nullable: true })
  team1Player2Id: string;

  @ApiPropertyOptional({ description: 'Team 2 Player 1 ID' })
  @Column({ name: 'team2_player1_id', nullable: true })
  team2Player1Id: string;

  @ApiPropertyOptional({ description: 'Team 2 Player 2 ID' })
  @Column({ name: 'team2_player2_id', nullable: true })
  team2Player2Id: string;

  @ApiPropertyOptional({
    description: 'Team 1 name',
    example: 'Team Alpha',
  })
  @Column({ name: 'team1_name', length: 256, nullable: true })
  team1Name: string;

  @ApiPropertyOptional({
    description: 'Team 2 name',
    example: 'Team Beta',
  })
  @Column({ name: 'team2_name', length: 256, nullable: true })
  team2Name: string;

  @ApiPropertyOptional({
    description: 'Team 1 score data',
    example: { sets: [21, 21], total: 42 },
  })
  @Column({ name: 'team1_score', type: 'jsonb', nullable: true })
  team1Score: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Team 2 score data',
    example: { sets: [19, 18], total: 37 },
  })
  @Column({ name: 'team2_score', type: 'jsonb', nullable: true })
  team2Score: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Winner team (1 or 2)',
    example: 1,
  })
  @Column({ name: 'winner_team', nullable: true })
  winnerTeam: number;

  @ApiPropertyOptional({
    description: 'Match notes',
    example: 'Great match with close scores',
  })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({
    description: 'Is bye match',
    example: false,
  })
  @Column({ name: 'is_bye', default: false })
  isBye: boolean;

  @ApiProperty({
    description: 'Match scores',
    type: () => [MatchScore],
  })
  @OneToMany(() => MatchScore, (score) => score.match)
  scores: MatchScore[];
}
