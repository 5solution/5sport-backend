import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AthleteEmailDto {
  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  name: string;

  @ApiProperty({ example: '10km' })
  @IsString()
  distance: string;

  @ApiProperty({ example: 'athlete@example.com' })
  @IsEmail()
  email: string;
}

export class TestGroupOrderEmailDto {
  @ApiProperty({ example: 'buyer@example.com' })
  @IsEmail()
  toEmail: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'ORD-ABC123' })
  @IsString()
  orderCode: string;

  @ApiProperty({ example: 'VnExpress Marathon 2026' })
  @IsString()
  eventName: string;

  @ApiProperty({ example: 'Team 5Sport' })
  @IsString()
  groupName: string;

  @ApiProperty({ example: 3 })
  @IsNumber()
  ticketNumber: number;

  @ApiProperty({ example: '13/03/2026' })
  @IsString()
  processDate: string;

  @ApiProperty({ example: '1,500,000 VND' })
  @IsString()
  totalPrice: string;

  @ApiProperty({ example: 'Bank Transfer' })
  @IsString()
  paymentMethod: string;

  @ApiProperty({ example: 'buyer@example.com' })
  @IsEmail()
  endUserEmail: string;

  @ApiProperty({ example: '0901234567' })
  @IsString()
  phone: string;

  @ApiProperty({ type: [AthleteEmailDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AthleteEmailDto)
  athletes: AthleteEmailDto[];
}
