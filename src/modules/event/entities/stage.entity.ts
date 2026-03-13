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
import { Match } from './match.entity';
import { StageType } from '../enums/stage-type.enum';
import { StageStatus } from '../enums/stage-status.enum';

@Entity('stages')
export class Stage extends BaseEntityWithoutId {
  @ApiProperty({
    description: 'Stage unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Session ID' })
  @Column({ name: 'session_id' })
  @Index()
  sessionId: string;

  @ApiProperty({
    description: 'Session relationship',
    type: () => EventSession,
  })
  @ManyToOne(() => EventSession, (session) => session.stages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_id' })
  session: EventSession;

  @ApiProperty({
    description: 'Stage name',
    example: 'Group Stage',
  })
  @Column({ length: 256 })
  name: string;

  @ApiProperty({
    description: 'Stage type',
    enum: StageType,
    example: StageType.SINGLE_ELIMINATION,
  })
  @Column({ name: 'stage_type', type: 'enum', enum: StageType })
  stageType: StageType;

  @ApiProperty({
    description: 'Stage status',
    enum: StageStatus,
    example: StageStatus.DRAFT,
  })
  @Column({
    type: 'enum',
    enum: StageStatus,
    default: StageStatus.DRAFT,
  })
  status: StageStatus;

  @ApiProperty({
    description: 'Sort order',
    example: 0,
  })
  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @ApiPropertyOptional({
    description: 'Stage configuration (varies by stage type)',
    example: { seedingType: 'RANDOM' },
  })
  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, any>;

  @ApiProperty({
    description: 'Matches in this stage',
    type: () => [Match],
  })
  @OneToMany(() => Match, (match) => match.stage)
  matches: Match[];
}
