import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntityWithoutId } from 'src/utils/base/base-entity';
import { Event } from './event.entity';
import { EventSession } from './event-session.entity';
import { Athlete } from 'src/modules/athlete/entities/athlete.entity';
import { User } from 'src/modules/user/user.entity';

export enum ParticipantStatus {
  REGISTERED = 'REGISTERED',
  /** Đôi: đã thanh toán vé lẻ, nhờ BTC ghép cặp hộ */
  FINDING_PARTNER = 'FINDING_PARTNER',
  /** Đôi: đã gửi lời mời, chờ VĐV B xác nhận */
  WAITING_PARTNER = 'WAITING_PARTNER',
  /** Vé hợp lệ — Đôi: đủ 2 xác nhận | Đơn: thanh toán xong */
  PAIRED = 'PAIRED',
  /** Đã quét QR tại sân (Đôi ghi nhận x/2) */
  CHECKED_IN = 'CHECKED_IN',
  /** Đã check-in đầy đủ quân số — đủ điều kiện xếp lịch thi đấu */
  READY = 'READY',
  /** Đang thi đấu — khóa sửa đổi thông tin */
  PLAYING = 'PLAYING',
  /** Đã thua, kết thúc giải đấu */
  ELIMINATED = 'ELIMINATED',
  /** Thắng chung kết tổng */
  WINNER = 'WINNER',
  /** Rút lui */
  WITHDRAWN = 'WITHDRAWN',
  /** Bị truất quyền thi đấu */
  DISQUALIFIED = 'DISQUALIFIED',
}

@Entity('event_participants')
@Index(['eventId', 'athleteId'], { unique: true })
export class EventParticipant extends BaseEntityWithoutId {
  @ApiProperty({
    description: 'Participant unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Event ID' })
  @Column({ name: 'event_id' })
  @Index()
  eventId: string;

  @ApiProperty({ description: 'Event relationship', type: () => Event })
  @ManyToOne(() => Event)
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @ApiPropertyOptional({ description: 'Event session ID' })
  @Column({ name: 'session_id', nullable: true })
  @Index()
  sessionId: string;

  @ApiPropertyOptional({
    description: 'Event session relationship',
    type: () => EventSession,
  })
  @ManyToOne(() => EventSession)
  @JoinColumn({ name: 'session_id' })
  session: EventSession;

  @ApiProperty({ description: 'Athlete ID' })
  @Column({ name: 'athlete_id' })
  @Index()
  athleteId: string;

  @ApiProperty({ description: 'Athlete relationship', type: () => Athlete })
  @ManyToOne(() => Athlete)
  @JoinColumn({ name: 'athlete_id' })
  athlete: Athlete;

  @ApiProperty({ description: 'User ID' })
  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @ApiProperty({ description: 'User relationship', type: () => User })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiPropertyOptional({ description: 'Partner athlete ID' })
  @Column({ name: 'partner_id', nullable: true })
  partnerId: string;

  @ApiPropertyOptional({
    description: 'Partner relationship',
    type: () => Athlete,
  })
  @ManyToOne(() => Athlete, { nullable: true })
  @JoinColumn({ name: 'partner_id' })
  partner: Athlete;

  @ApiProperty({
    description: 'Ticket code',
    example: 'PB-001-A',
  })
  @Column({ name: 'ticket_code', length: 20 })
  @Index()
  ticketCode: string;

  @ApiProperty({
    description: 'Registration date',
    example: '2024-02-01T10:00:00Z',
  })
  @Column({ name: 'registration_date', type: 'timestamp' })
  registrationDate: Date;

  @ApiPropertyOptional({
    description: 'Check-in date',
    example: '2024-02-15T08:00:00Z',
  })
  @Column({ name: 'checkin_date', type: 'timestamp', nullable: true })
  checkinDate: Date;

  @ApiProperty({
    description: 'Participant status',
    enum: ParticipantStatus,
    example: ParticipantStatus.PAIRED,
  })
  @Column({
    type: 'enum',
    enum: ParticipantStatus,
    default: ParticipantStatus.PAIRED,
  })
  @Index()
  status: ParticipantStatus;

  @ApiPropertyOptional({
    description: 'Bib number',
    example: '001',
  })
  @Column({ name: 'bib_number', nullable: true })
  bibNumber: string;

  @ApiPropertyOptional({
    description: 'Seed number (set by admin)',
    example: 1,
  })
  @Column({ nullable: true, type: 'int' })
  seed: number;

  @ApiPropertyOptional({
    description: 'Custom data from event custom fields',
    example: { emergencyContact: '+84901234567', tShirtSize: 'M' },
  })
  @Column({ type: 'jsonb', nullable: true })
  customData: Record<string, any>;
}
