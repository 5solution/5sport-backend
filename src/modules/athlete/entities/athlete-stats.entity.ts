import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntityWithoutId } from 'src/utils/base/base-entity';
import { Athlete } from './athlete.entity';

@Entity('athlete_stats')
@Index(['athleteId', 'date'], { unique: true })
export class AthleteStats extends BaseEntityWithoutId {
  @ApiProperty({
    description: 'Stats record ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Athlete ID' })
  @Column({ name: 'athlete_id' })
  @Index()
  athleteId: string;

  @ApiProperty({ description: 'Athlete relationship', type: () => Athlete })
  @ManyToOne(() => Athlete, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'athlete_id' })
  athlete: Athlete;

  @ApiProperty({
    description: 'Stats date',
    example: '2024-02-14',
  })
  @Column({ type: 'date' })
  @Index()
  date: Date;

  @ApiProperty({
    description: 'Rating on this date',
    example: 4.5,
  })
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  rating: number;

  @ApiProperty({
    description: 'Matches played on this date',
    example: 3,
  })
  @Column({ name: 'matches_played', default: 0 })
  matchesPlayed: number;

  @ApiProperty({
    description: 'Wins on this date',
    example: 2,
  })
  @Column({ default: 0 })
  wins: number;

  @ApiProperty({
    description: 'Losses on this date',
    example: 1,
  })
  @Column({ default: 0 })
  losses: number;

  @ApiProperty({
    description: 'Events participated on this date',
    example: 1,
  })
  @Column({ name: 'events_participated', default: 0 })
  eventsParticipated: number;
}
