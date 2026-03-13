import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Province } from './province.entity';

@Entity('wards')
export class Ward {
  @PrimaryColumn()
  code: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50 })
  division_type: string;

  @Column({ length: 100 })
  codename: string;

  @Column()
  province_code: number;

  @ManyToOne(() => Province, (province) => province.wards)
  @JoinColumn({ name: 'province_code' })
  province: Province;
}
