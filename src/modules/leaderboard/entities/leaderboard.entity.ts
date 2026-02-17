import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntityWithoutId } from 'src/utils/base/base-entity';
import { SportType } from 'src/modules/event/enums/sport-type.enum';
import { LeaderboardType } from '../enums/leaderboard-type.enum';
import { LeaderboardEntry } from './leaderboard-entry.entity';

@Entity('leaderboards')
@Index(['sportType', 'type', 'period'])
export class Leaderboard extends BaseEntityWithoutId {
  @ApiProperty({
    description: 'Leaderboard unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Leaderboard name',
    example: 'January 2024 Pickleball Rankings',
  })
  @Column({ length: 256 })
  name: string;

  @ApiProperty({
    description: 'Leaderboard type',
    enum: LeaderboardType,
    example: LeaderboardType.MONTHLY,
  })
  @Column({ type: 'enum', enum: LeaderboardType })
  @Index()
  type: LeaderboardType;

  @ApiProperty({
    description: 'Sport type',
    enum: SportType,
    example: SportType.PICKLEBALL,
  })
  @Column({ name: 'sport_type', type: 'enum', enum: SportType })
  @Index()
  sportType: SportType;

  @ApiPropertyOptional({
    description: 'Period for monthly/yearly leaderboards',
    example: '2024-01-01',
  })
  @Column({ type: 'date', nullable: true })
  period: Date;

  @ApiPropertyOptional({
    description: 'Event ID for event-specific leaderboards',
    example: 'event-uuid',
  })
  @Column({ name: 'event_id', nullable: true })
  @Index()
  eventId: string;

  @ApiProperty({
    description: 'Start date',
    example: '2024-01-01',
  })
  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @ApiPropertyOptional({
    description: 'End date',
    example: '2024-01-31',
  })
  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date;

  @ApiProperty({
    description: 'Active status',
    example: true,
  })
  @Column({ name: 'is_active', default: true })
  @Index()
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Description',
    example: 'Monthly rankings for January 2024',
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    description: 'Leaderboard entries',
    type: () => [LeaderboardEntry],
  })
  @OneToMany(() => LeaderboardEntry, (entry) => entry.leaderboard)
  entries: LeaderboardEntry[];
}
