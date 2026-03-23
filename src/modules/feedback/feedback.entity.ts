import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

export enum FeedbackCategory {
  GENERAL = 'GENERAL',
  EVENT = 'EVENT',
  PAYMENT = 'PAYMENT',
  UI_UX = 'UI_UX',
  BUG = 'BUG',
  SUGGESTION = 'SUGGESTION',
}

export enum FeedbackStatus {
  NEW = 'NEW',
  REVIEWED = 'REVIEWED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

@Entity('feedbacks')
export class Feedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'enum', enum: FeedbackCategory, default: FeedbackCategory.GENERAL })
  category: FeedbackCategory;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'smallint', nullable: true })
  rating: number;

  @Column({ type: 'enum', enum: FeedbackStatus, default: FeedbackStatus.NEW })
  status: FeedbackStatus;

  @Column({ type: 'text', nullable: true })
  adminNote: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
