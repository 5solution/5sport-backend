import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { Ward } from './ward.entity';

@Entity('provinces')
export class Province {
  @PrimaryColumn()
  code: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50 })
  division_type: string;

  @Column({ length: 100 })
  codename: string;

  @Column()
  phone_code: number;

  @OneToMany(() => Ward, (ward) => ward.province)
  wards: Ward[];
}
