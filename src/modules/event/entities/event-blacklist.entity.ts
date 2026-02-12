import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { BlacklistType } from '../enums/blacklist-type.enum';
import { Event } from './event.entity';

@Entity('event_blacklist')
@Unique(['eventId', 'type', 'value'])
export class EventBlacklist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id' })
  eventId: string;

  @ManyToOne(() => Event, (event) => event.blacklist, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column({ type: 'enum', enum: BlacklistType })
  type: BlacklistType;

  @Column({ length: 256 })
  value: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
