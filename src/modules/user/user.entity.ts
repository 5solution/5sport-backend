import { BaseEntityWithoutId } from 'src/utils/base/base-entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User extends BaseEntityWithoutId {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  username: string;

  @Column({ nullable: true })
  password: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ nullable: true, name: 'google_id' })
  googleId: string;

  @Column({ nullable: true, name: 'display_name' })
  displayName: string;

  @Column({ nullable: true, name: 'avatar_url' })
  avatarUrl: string;
}
