import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntityWithoutId } from 'src/utils/base/base-entity';
import { MatchType } from '../enums/match-type.enum';
import { RatingSource } from '../enums/rating-source.enum';
import { Event } from './event.entity';
import { TicketTier } from './ticket-tier.entity';
import { Stage } from './stage.entity';

@Entity('event_sessions')
export class EventSession extends BaseEntityWithoutId {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id' })
  eventId: string;

  @ManyToOne(() => Event, (event) => event.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column({ length: 256 })
  name: string;

  @Column({ name: 'match_type', type: 'enum', enum: MatchType })
  matchType: MatchType;

  @Column({ name: 'require_partner', default: false })
  requirePartner: boolean;

  @Column({ name: 'start_time', type: 'timestamp' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamp' })
  endTime: Date;

  @Column({ name: 'ticket_code', length: 3 })
  ticketCode: string;

  @Column({ name: 'ticket_image_url', type: 'text', nullable: true })
  ticketImageUrl: string;

  @Column({ name: 'rating_check_enabled', default: false })
  ratingCheckEnabled: boolean;

  @Column({ name: 'rating_sources', type: 'simple-array', nullable: true })
  ratingSources: RatingSource[];

  @Column({
    name: 'min_rating',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  minRating: number;

  @Column({
    name: 'max_rating',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  maxRating: number;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @OneToMany(() => TicketTier, (tier) => tier.session)
  ticketTiers: TicketTier[];

  @OneToMany(() => Stage, (stage) => stage.session)
  stages: Stage[];
}
