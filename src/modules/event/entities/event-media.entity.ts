import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MediaType } from '../enums/media-type.enum';
import { Event } from './event.entity';

@Entity('event_media')
export class EventMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id' })
  eventId: string;

  @ManyToOne(() => Event, (event) => event.media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column({ type: 'enum', enum: MediaType })
  type: MediaType;

  @Column({ type: 'text' })
  url: string;

  @Column({ name: 'file_size' })
  fileSize: number;

  @Column({ name: 'mime_type', length: 50 })
  mimeType: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
