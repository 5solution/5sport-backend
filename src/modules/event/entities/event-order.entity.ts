import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Event } from './event.entity';

export enum EventOrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export interface OrderAthleteInfo {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  idNumber?: string;
  ticketTierId: string;
  ticketTierName: string;
  unitPrice: number;
}

@Entity('event_orders')
export class EventOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  eventId: string;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @Column({ nullable: true })
  userId: string;

  @Index({ unique: true })
  @Column({ length: 40 })
  orderCode: string;

  @Column()
  contactName: string;

  @Column()
  contactEmail: string;

  @Column()
  contactPhone: string;

  @Column('jsonb')
  athletes: OrderAthleteInfo[];

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({
    type: 'enum',
    enum: EventOrderStatus,
    default: EventOrderStatus.PENDING,
  })
  paymentStatus: EventOrderStatus;

  @Column({ type: 'decimal', precision: 15, scale: 0, default: 0 })
  totalAmount: number;

  @Column({ nullable: true })
  discountCode: string;

  @Column({ type: 'decimal', precision: 15, scale: 0, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 0, default: 0 })
  finalAmount: number;

  @Column({ nullable: true })
  paymentProvider: string;

  @Column({ nullable: true })
  providerTransactionId: string;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  paymentMetadata: Record<string, any>;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  orderDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
