import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntityWithoutId } from 'src/utils/base/base-entity';
import { Event } from './event.entity';

@Entity('event_descriptions')
export class EventDescription extends BaseEntityWithoutId {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id' })
  eventId: string;

  @ManyToOne(() => Event, (event) => event.descriptions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column({ length: 256, nullable: true })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;
}
