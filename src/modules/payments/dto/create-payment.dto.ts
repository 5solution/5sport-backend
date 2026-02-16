import { IsNotEmpty, IsNumber, IsString, Min, IsEnum, IsOptional } from 'class-validator';
import { PaymentMethod } from 'src/modules/event/enums/payment-method.enum';
import { PaymentDisplayMode } from '../interfaces/payment-provider.interface';

export class CreatePaymentDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1000) // Minimum 1000 VND
  amount: number;

  @IsNotEmpty()
  @IsString()
  orderId: string;

  @IsNotEmpty()
  @IsString()
  orderInfo: string;

  @IsNotEmpty()
  @IsString()
  ipAddr: string;

  @IsOptional()
  @IsString()
  returnUrl?: string;

  @IsNotEmpty()
  @IsString()
  callbackUrl: string;

  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsEnum(PaymentDisplayMode)
  displayMode?: PaymentDisplayMode;
}
