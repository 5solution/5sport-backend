import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { SportType } from 'src/modules/event/enums/sport-type.enum';

export class CreateAthleteDto {
  @ApiProperty({
    description: 'Athlete name',
    example: 'John Doe',
    maxLength: 256,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  name: string;

  @ApiProperty({
    description: 'Sport type',
    enum: SportType,
    example: SportType.PICKLEBALL,
  })
  @IsEnum(SportType)
  @IsNotEmpty()
  sportType: SportType;

  @ApiPropertyOptional({
    description: 'Date of birth (ISO format)',
    example: '1990-01-15',
  })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: 'Gender',
    example: 'male',
    maxLength: 20,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  gender?: string;

  @ApiPropertyOptional({
    description: 'Biography',
    example: 'Professional pickleball player from HCMC',
  })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({
    description: 'Profile image URL',
    example: 'https://example.com/profile.jpg',
  })
  @IsUrl()
  @IsOptional()
  profileImageUrl?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+84901234567',
    maxLength: 20,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Ho Chi Minh City',
    maxLength: 256,
  })
  @IsString()
  @IsOptional()
  @MaxLength(256)
  city?: string;

  @ApiPropertyOptional({
    description: 'Country',
    example: 'Vietnam',
    maxLength: 256,
  })
  @IsString()
  @IsOptional()
  @MaxLength(256)
  country?: string;
}
