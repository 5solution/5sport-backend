import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntityWithoutId } from 'src/utils/base/base-entity';
import { FieldType } from '../enums/field-type.enum';
import { Event } from './event.entity';

export const DB_MAPPING_FIELDS = [
  'participantName',
  'participantsFirstName',
  'participantsLastName',
  'participantsDOB',
  'participantsGender',
  'participantsEmail',
  'participantsPhone',
  'participantsRacekit',
  'participantsPortrait',
  'participantsId',
  'participantsAddress',
  'participantsCompany',
  'participantsNational',
  'participantsQuestion',
  'participantsNote',
  'participantsCity',
] as const;

export type DbMappingField = (typeof DB_MAPPING_FIELDS)[number];

@Entity('event_custom_fields')
export class EventCustomField extends BaseEntityWithoutId {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id' })
  eventId: string;

  @ManyToOne(() => Event, (event) => event.customFields, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column({ length: 256 })
  label: string;

  @Column({ name: 'field_name', length: 256 })
  fieldName: string;

  @Column({ length: 250, nullable: true })
  description: string;

  @Column({ name: 'field_type', type: 'enum', enum: FieldType })
  fieldType: FieldType;

  @Column({ type: 'simple-array', nullable: true })
  options: string[];

  @Column({ name: 'allowed_file_types', type: 'simple-array', nullable: true })
  allowedFileTypes: string[];

  @Column({ name: 'default_value', type: 'text', nullable: true })
  defaultValue: string;

  @Column({ name: 'attachment_url', type: 'text', nullable: true })
  attachmentUrl: string;

  @Column({ name: 'db_mapping', length: 50, nullable: true })
  dbMapping: string;

  @Column({ name: 'is_required', default: false })
  isRequired: boolean;

  @Column({ name: 'is_visible', default: true })
  isVisible: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;
}
