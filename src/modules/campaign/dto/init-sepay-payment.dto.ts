import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class InitSepayPaymentDto {
  @ApiPropertyOptional({
    description: 'Payment method (default: BANK_TRANSFER)',
    example: 'BANK_TRANSFER',
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}
