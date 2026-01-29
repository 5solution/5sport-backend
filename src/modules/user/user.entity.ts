import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from 'src/common/enums/role.enum';
import { BaseEntityWithoutId } from 'src/utils/base/base-entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User extends BaseEntityWithoutId {
  @ApiProperty({
    description: 'User unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'User email address (primary identifier)',
    example: 'user@example.com',
  })
  @Column({ unique: true })
  email: string;

  @ApiPropertyOptional({
    description: 'Hashed password (null for OAuth users)',
  })
  @Column({ nullable: true })
  password: string;

  @ApiProperty({
    description: 'User role for access control',
    enum: Role,
    example: Role.USER,
    default: Role.USER,
  })
  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  @ApiProperty({
    description: 'Tags for user categorization',
    example: ['sports', 'fitness', 'premium'],
    type: [String],
    default: [],
  })
  @Column('simple-array', { default: '' })
  tags: string[];

  @ApiPropertyOptional({
    description: 'Google OAuth ID',
  })
  @Column({ nullable: true, name: 'google_id' })
  googleId: string;

  @ApiPropertyOptional({
    description: 'User display name',
    example: 'John Doe',
  })
  @Column({ nullable: true, name: 'display_name' })
  displayName: string;

  @ApiPropertyOptional({
    description: 'User avatar URL',
    example: 'https://example.com/avatar.jpg',
  })
  @Column({ nullable: true, name: 'avatar_url' })
  avatarUrl: string;
}
