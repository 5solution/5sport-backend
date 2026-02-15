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
import { Leaderboard } from './leaderboard.entity';
import { Athlete } from 'src/modules/athlete/entities/athlete.entity';

@Entity('leaderboard_entries')
@Index(['leaderboardId', 'rank'])
@Index(['leaderboardId', 'athleteId'], { unique: true })
export class LeaderboardEntry extends BaseEntityWithoutId {
  @ApiProperty({
    description: 'Entry unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Leaderboard ID' })
  @Column({ name: 'leaderboard_id' })
  @Index()
  leaderboardId: string;

  @ApiProperty({
    description: 'Leaderboard relationship',
    type: () => Leaderboard,
  })
  @ManyToOne(() => Leaderboard, (leaderboard) => leaderboard.entries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'leaderboard_id' })
  leaderboard: Leaderboard;

  @ApiProperty({ description: 'Athlete ID' })
  @Column({ name: 'athlete_id' })
  @Index()
  athleteId: string;

  @ApiProperty({ description: 'Athlete relationship', type: () => Athlete })
  @ManyToOne(() => Athlete)
  @JoinColumn({ name: 'athlete_id' })
  athlete: Athlete;

  @ApiProperty({
    description: 'Current rank',
    example: 1,
  })
  @Column()
  @Index()
  rank: number;

  @ApiPropertyOptional({
    description: 'Previous rank',
    example: 3,
  })
  @Column({ name: 'previous_rank', nullable: true })
  previousRank: number;

  @ApiProperty({
    description: 'Score/points',
    example: 1500.5,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  score: number;

  @ApiProperty({
    description: 'Matches played',
    example: 15,
  })
  @Column({ name: 'matches_played', default: 0 })
  matchesPlayed: number;

  @ApiProperty({
    description: 'Wins',
    example: 10,
  })
  @Column({ default: 0 })
  wins: number;

  @ApiProperty({
    description: 'Losses',
    example: 5,
  })
  @Column({ default: 0 })
  losses: number;

  @ApiProperty({
    description: 'Win rate percentage',
    example: 66.67,
  })
  @Column({
    name: 'win_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  winRate: number;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { streak: 3, lastMatchDate: '2024-02-14' },
  })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;
}
