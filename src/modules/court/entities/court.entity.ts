import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntityWithoutId } from 'src/utils/base/base-entity';
import { Event } from 'src/modules/event/entities/event.entity';
import { CourtStatus } from '../enums/court-status.enum';

@Entity('courts')
export class Court extends BaseEntityWithoutId {
  @ApiProperty({ description: 'Court unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Event ID' })
  @Column({ name: 'event_id' })
  @Index()
  eventId: string;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @ApiProperty({ description: 'Court name', example: 'San 1' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({ description: 'Sort order', default: 0 })
  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @ApiProperty({
    description: 'Court status',
    enum: CourtStatus,
    default: CourtStatus.ACTIVE,
  })
  @Column({
    type: 'enum',
    enum: CourtStatus,
    default: CourtStatus.ACTIVE,
  })
  status: CourtStatus;

  @ApiProperty({ description: 'Access secret for QR authentication' })
  @Column({ name: 'access_secret', length: 64 })
  accessSecret: string;

  @ApiProperty({ description: 'Is ghost/holding court', default: false })
  @Column({ name: 'is_ghost', default: false })
  isGhost: boolean;

  @ApiPropertyOptional({
    description: 'Allowed session IDs for category filtering',
    type: [String],
  })
  @Column({
    name: 'allowed_session_ids',
    type: 'simple-array',
    nullable: true,
  })
  allowedSessionIds: string[];
}
