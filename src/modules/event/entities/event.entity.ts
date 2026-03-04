import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntityWithoutId } from 'src/utils/base/base-entity';
import { User } from 'src/modules/user/user.entity';
import { EventStatus } from '../enums/event-status.enum';
import { SportType } from '../enums/sport-type.enum';
import { PaymentMethod } from '../enums/payment-method.enum';
import { EventMedia } from './event-media.entity';
import { EventDescription } from './event-description.entity';
import { EventSession } from './event-session.entity';
import { EventCustomField } from './event-custom-field.entity';
import { EventBlacklist } from './event-blacklist.entity';

@Entity('events')
export class Event extends BaseEntityWithoutId {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organizer_id' })
  organizerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'organizer_id' })
  organizer: User;

  @Column({ length: 256 })
  name: string;

  @Column({ length: 256, nullable: true })
  brand: string;

  @Column({ type: 'enum', enum: SportType })
  sportType: SportType;

  @Column({ length: 20 })
  hotline: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ name: 'province_code', length: 10 })
  provinceCode: string;

  @Column({ name: 'ward_code', length: 10 })
  wardCode: string;

  @Column({ name: 'prefix_code', length: 6 })
  prefixCode: string;

  @Column({ length: 512, unique: true })
  slug: string;

  @Column({ name: 'allow_transfer', default: true })
  allowTransfer: boolean;

  @Column({ type: 'enum', enum: EventStatus, default: EventStatus.DRAFT })
  status: EventStatus;

  @Column({ name: 'event_start_time', type: 'timestamp' })
  eventStartTime: Date;

  @Column({ name: 'event_end_time', type: 'timestamp' })
  eventEndTime: Date;

  @Column({ name: 'edit_info_open_time', type: 'timestamp' })
  editInfoOpenTime: Date;

  @Column({ name: 'edit_info_close_time', type: 'timestamp' })
  editInfoCloseTime: Date;

  @Column({ name: 'transfer_open_time', type: 'timestamp', nullable: true })
  transferOpenTime: Date;

  @Column({ name: 'transfer_close_time', type: 'timestamp', nullable: true })
  transferCloseTime: Date;

  @Column({ name: 'checkin_open_time', type: 'timestamp' })
  checkinOpenTime: Date;

  @Column({ name: 'checkin_close_time', type: 'timestamp' })
  checkinCloseTime: Date;

  @Column({ name: 'payment_methods', type: 'simple-array' })
  paymentMethods: PaymentMethod[];

  @Column({ name: 'scoring_config', type: 'jsonb', nullable: true })
  scoringConfig: Record<string, any>;

  @Column({ name: 'banner_enabled', default: false })
  bannerEnabled: boolean;

  @Column({ name: 'banner_image_url', type: 'text', nullable: true })
  bannerImageUrl: string;

  @Column({ name: 'banner_cta_url', type: 'text', nullable: true })
  bannerCtaUrl: string;

  @Column({ name: 'terms_file_url', type: 'text', nullable: true })
  termsFileUrl: string;

  @Column({ name: 'conditions_file_url', type: 'text', nullable: true })
  conditionsFileUrl: string;

  @OneToMany(() => EventMedia, (media) => media.event)
  media: EventMedia[];

  @OneToMany(() => EventDescription, (desc) => desc.event)
  descriptions: EventDescription[];

  @OneToMany(() => EventSession, (session) => session.event)
  sessions: EventSession[];

  @OneToMany(() => EventCustomField, (field) => field.event)
  customFields: EventCustomField[];

  @OneToMany(() => EventBlacklist, (bl) => bl.event)
  blacklist: EventBlacklist[];
}
