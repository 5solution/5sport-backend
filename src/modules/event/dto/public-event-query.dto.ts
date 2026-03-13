import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination.dto';
import { SportType } from '../enums/sport-type.enum';

export class PublicEventQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: SportType, description: 'Lọc theo loại thể thao' })
  @IsEnum(SportType)
  @IsOptional()
  sportType?: SportType;

  @ApiPropertyOptional({ description: 'Tìm kiếm theo tên sự kiện' })
  @IsString()
  @IsOptional()
  search?: string;
}
