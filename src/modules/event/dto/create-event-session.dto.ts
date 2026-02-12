import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { MatchType } from '../enums/match-type.enum';
import { RatingSource } from '../enums/rating-source.enum';

export class CreateEventSessionDto {
  @ApiProperty({
    description: 'Tên hạng mục thi đấu',
    example: 'Thi đấu đơn nam trình độ >5.0',
    maxLength: 256,
  })
  @IsString()
  @MaxLength(256)
  name: string;

  @ApiProperty({
    description: 'Thể thức thi đấu',
    enum: MatchType,
    example: MatchType.SINGLES,
  })
  @IsEnum(MatchType)
  matchType: MatchType;

  @ApiPropertyOptional({
    description: 'Yêu cầu có đối thủ/đồng đội (chỉ với Doubles)',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  requirePartner?: boolean;

  @ApiProperty({
    description: 'Thời gian bắt đầu nội dung thi đấu (ISO 8601)',
    example: '2026-03-01T08:00:00Z',
  })
  @IsDateString()
  startTime: string;

  @ApiProperty({
    description: 'Thời gian kết thúc dự kiến (ISO 8601)',
    example: '2026-03-01T18:00:00Z',
  })
  @IsDateString()
  endTime: string;

  @ApiProperty({
    description: 'Mã vé (tối đa 3 ký tự, unique trong sự kiện)',
    example: 'DNM',
    maxLength: 3,
  })
  @IsString()
  @MaxLength(3)
  ticketCode: string;

  @ApiPropertyOptional({
    description: 'URL hình ảnh vé',
    example: 'https://s3.amazonaws.com/bucket/ticket.png',
  })
  @IsOptional()
  @IsString()
  ticketImageUrl?: string;

  @ApiPropertyOptional({
    description: 'Bật kiểm tra rating/trình độ',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  ratingCheckEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Nguồn tham chiếu rating (bắt buộc nếu ratingCheckEnabled=true)',
    enum: RatingSource,
    isArray: true,
    example: [RatingSource.DUPR, RatingSource.FIVE_RATING],
  })
  @ValidateIf((o) => o.ratingCheckEnabled === true)
  @IsArray()
  @IsEnum(RatingSource, { each: true })
  ratingSources?: RatingSource[];

  @ApiPropertyOptional({
    description: 'Ngưỡng điểm tối thiểu (bắt buộc nếu ratingCheckEnabled=true)',
    example: 3.5,
  })
  @ValidateIf((o) => o.ratingCheckEnabled === true)
  @IsNumber()
  @Type(() => Number)
  minRating?: number;

  @ApiPropertyOptional({
    description: 'Ngưỡng điểm tối đa (bắt buộc nếu ratingCheckEnabled=true)',
    example: 5.0,
  })
  @ValidateIf((o) => o.ratingCheckEnabled === true)
  @IsNumber()
  @Type(() => Number)
  maxRating?: number;
}
