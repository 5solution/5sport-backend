import { IsInt, IsString, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SepayIpnOrderDto {
  @IsString()
  id: string;

  @IsString()
  order_id: string;

  @IsString()
  order_status: string;

  @IsString()
  order_currency: string;

  @IsString()
  order_amount: string;

  @IsString()
  @IsNotEmpty()
  order_invoice_number: string;

  @IsOptional()
  custom_data?: any;

  @IsOptional()
  order_description?: string;
}

export class SepayIpnTransactionDto {
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  payment_method?: string;

  @IsString()
  transaction_id: string;

  @IsOptional()
  @IsString()
  transaction_type?: string;

  @IsOptional()
  @IsString()
  transaction_date?: string;

  @IsOptional()
  @IsString()
  transaction_status?: string;

  @IsOptional()
  @IsString()
  transaction_amount?: string;

  @IsOptional()
  @IsString()
  transaction_currency?: string;
}

export class SepayIpnPayloadDto {
  @IsInt()
  timestamp: number;

  @IsString()
  @IsNotEmpty()
  notification_type: string;

  @ValidateNested()
  @Type(() => SepayIpnOrderDto)
  order: SepayIpnOrderDto;

  @ValidateNested()
  @Type(() => SepayIpnTransactionDto)
  transaction: SepayIpnTransactionDto;

  @IsOptional()
  customer?: any;

  @IsOptional()
  agreement?: any;
}
