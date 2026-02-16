import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';
import { BaseEntityWithoutId } from 'src/utils/base/base-entity';
import { PaymentMethod } from 'src/modules/event/enums/payment-method.enum';
import { PaymentTransactionStatus } from '../interfaces/payment-provider.interface';

@Entity('payments')
@Index(['orderId'], { unique: true })
@Index(['paymentId'])
@Index(['status'])
export class Payment extends BaseEntityWithoutId {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', length: 40 })
  orderId: string;

  @Column({ name: 'payment_id', nullable: true, length: 100 })
  paymentId: string;

  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Column({ name: 'provider_name', length: 50 })
  providerName: string;

  @Column({ type: 'decimal', precision: 12, scale: 0 })
  amount: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'ip_addr', length: 45 })
  ipAddr: string;

  @Column({
    type: 'enum',
    enum: PaymentTransactionStatus,
    default: PaymentTransactionStatus.PENDING,
  })
  status: PaymentTransactionStatus;

  @Column({ name: 'return_url', type: 'text', nullable: true })
  returnUrl: string;

  @Column({ name: 'callback_url', type: 'text' })
  callbackUrl: string;

  @Column({ name: 'expire_date', type: 'timestamp' })
  expireDate: Date;

  @Column({ name: 'error_code', nullable: true, length: 50 })
  errorCode: string;

  @Column({ name: 'error_message', nullable: true, type: 'text' })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ name: 'payment_date', type: 'timestamp', nullable: true })
  paymentDate: Date;
}
