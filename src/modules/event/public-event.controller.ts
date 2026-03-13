import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/decorators/api-success-response.decorator';

import { EventService } from './event.service';
import { EventResponseDto } from './dto/event-response.dto';
import { PublicEventQueryDto } from './dto/public-event-query.dto';

@ApiTags('Public')
@Controller('public/events')
export class PublicEventController {
  constructor(private readonly eventService: EventService) {}

  @Get()
  @ApiOperation({
    summary: 'Danh sách sự kiện (công khai)',
    description: 'Lấy danh sách sự kiện đã xuất bản, hỗ trợ lọc theo loại thể thao và tìm kiếm tên',
  })
  @ApiSuccessResponse(null, {
    description: 'Danh sách sự kiện',
    schema: {
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/EventResponseDto' } },
        meta: { type: 'object' },
      },
    },
  })
  findAll(@Query() query: PublicEventQueryDto) {
    return this.eventService.findPublic(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Chi tiết sự kiện (công khai)',
    description: 'Lấy thông tin chi tiết sự kiện không cần đăng nhập',
  })
  @ApiSuccessResponse(EventResponseDto, {
    description: 'Thông tin sự kiện',
  })
  findOne(@Param('id') id: string) {
    return this.eventService.findById(id);
  }
}
