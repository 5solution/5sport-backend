import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsOptional,
  IsUUID,
  IsEnum,
  ArrayMinSize,
} from 'class-validator';
import { PaymentMethod } from '../enums/payment-method.enum';

export class OrderAthleteDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  dateOfBirth: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  idNumber?: string;

  @ApiProperty()
  @IsUUID()
  ticketTierId: string;
}

export class CreateEventOrderDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  contactName: string;

  @ApiProperty()
  @IsEmail()
  contactEmail: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  contactPhone: string;

  @ApiProperty({ type: [OrderAthleteDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderAthleteDto)
  athletes: OrderAthleteDto[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  discountCode?: string;
}

export class InitPaymentDto {
  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  returnUrl?: string;
}
