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
import { User } from 'src/modules/user/user.entity';
import { SportType } from 'src/modules/event/enums/sport-type.enum';

@Entity('athletes')
@Index(['userId', 'sportType'], { unique: true })
export class Athlete extends BaseEntityWithoutId {
  @ApiProperty({
    description: 'Athlete unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User ID' })
  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @ApiProperty({ description: 'User relationship', type: () => User })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ description: 'Athlete name', example: 'John Doe' })
  @Column({ length: 256 })
  name: string;

  @ApiProperty({
    description: 'Sport type',
    enum: SportType,
    example: SportType.PICKLEBALL,
  })
  @Column({ name: 'sport_type', type: 'enum', enum: SportType })
  @Index()
  sportType: SportType;

  @ApiPropertyOptional({
    description: 'Date of birth',
    example: '1990-01-15',
  })
  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date;

  @ApiPropertyOptional({
    description: 'Gender',
    example: 'male',
  })
  @Column({ length: 20, nullable: true })
  gender: string;

  @ApiPropertyOptional({
    description: 'Biography',
    example: 'Professional pickleball player from HCMC',
  })
  @Column({ type: 'text', nullable: true })
  bio: string;

  @ApiPropertyOptional({
    description: 'Profile image URL',
    example: 'https://example.com/profile.jpg',
  })
  @Column({ name: 'profile_image_url', type: 'text', nullable: true })
  profileImageUrl: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+84901234567',
  })
  @Column({ name: 'phone_number', length: 20, nullable: true })
  phoneNumber: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Ho Chi Minh City',
  })
  @Column({ length: 256, nullable: true })
  city: string;

  @ApiPropertyOptional({
    description: 'Country',
    example: 'Vietnam',
  })
  @Column({ length: 256, nullable: true })
  country: string;

  @ApiProperty({
    description: 'Current rating',
    example: 4.5,
  })
  @Column({
    name: 'current_rating',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  @Index()
  currentRating: number;

  @ApiProperty({
    description: 'Peak rating',
    example: 4.8,
  })
  @Column({
    name: 'peak_rating',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  peakRating: number;

  @ApiPropertyOptional({
    description: 'Rating source',
    example: 'DUPR',
  })
  @Column({ name: 'rating_source', length: 50, nullable: true })
  ratingSource: string;

  @ApiProperty({
    description: 'Total events participated',
    example: 15,
  })
  @Column({ name: 'total_events', default: 0 })
  totalEvents: number;

  @ApiProperty({
    description: 'Total matches played',
    example: 42,
  })
  @Column({ name: 'total_matches', default: 0 })
  totalMatches: number;

  @ApiProperty({
    description: 'Total wins',
    example: 28,
  })
  @Column({ default: 0 })
  wins: number;

  @ApiProperty({
    description: 'Total losses',
    example: 14,
  })
  @Column({ default: 0 })
  losses: number;

  @ApiProperty({
    description: 'Win rate percentage',
    example: 66.67,
  })
  @Column({
    name: 'win_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  winRate: number;

  @ApiPropertyOptional({
    description: 'Achievements',
    example: ['2024 City Champion', 'Best Newcomer 2023'],
    type: [String],
  })
  @Column({ type: 'simple-array', nullable: true })
  achievements: string[];

  @ApiProperty({
    description: 'Verified athlete',
    example: false,
  })
  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @ApiProperty({
    description: 'Active status',
    example: true,
  })
  @Column({ name: 'is_active', default: true })
  @Index()
  isActive: boolean;
}
