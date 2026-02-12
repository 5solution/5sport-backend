import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntityWithoutId } from 'src/utils/base/base-entity';
import { EventSession } from './event-session.entity';

@Entity('ticket_tiers')
export class TicketTier extends BaseEntityWithoutId {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id' })
  sessionId: string;

  @ManyToOne(() => EventSession, (session) => session.ticketTiers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_id' })
  session: EventSession;

  @Column({ length: 256 })
  name: string;

  @Column({ name: 'is_free', default: false })
  isFree: boolean;

  @Column({ type: 'decimal', precision: 15, scale: 0, nullable: true })
  price: number;

  @Column({ name: 'total_quantity' })
  totalQuantity: number;

  @Column({ name: 'min_per_order', default: 1 })
  minPerOrder: number;

  @Column({ name: 'max_per_order' })
  maxPerOrder: number;

  @Column({ name: 'is_visible', default: true })
  isVisible: boolean;

  @Column({ name: 'sale_start_time', type: 'timestamp' })
  saleStartTime: Date;

  @Column({ name: 'sale_end_time', type: 'timestamp' })
  saleEndTime: Date;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;
}
