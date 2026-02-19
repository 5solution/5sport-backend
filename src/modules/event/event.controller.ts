import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiSuccessResponse,
  ApiCreatedSuccessResponse,
} from 'src/common/decorators/api-success-response.decorator';

import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { PaginationQueryDto } from 'src/common/dto/pagination.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { User } from 'src/modules/user/user.entity';

import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CreateEventSessionDto } from './dto/create-event-session.dto';
import { UpdateEventSessionDto } from './dto/update-event-session.dto';
import { CreateTicketTierDto } from './dto/create-ticket-tier.dto';
import { UpdateTicketTierDto } from './dto/update-ticket-tier.dto';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';
import { UpdateCustomFieldDto } from './dto/update-custom-field.dto';
import { ScoringConfigDto } from './dto/scoring-config.dto';
import { CreateDescriptionDto } from './dto/create-description.dto';
import { UpdateDescriptionDto } from './dto/update-description.dto';
import { SetBlacklistDto } from './dto/blacklist.dto';
import { ReorderDto } from './dto/reorder.dto';
import {
  EventResponseDto,
  SessionResponseDto,
  TicketTierResponseDto,
  CustomFieldResponseDto,
  BlacklistResponseDto,
  DescriptionResponseDto,
} from './dto/event-response.dto';

@ApiTags('Events')
@ApiBearerAuth('JWT-auth')
@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ORGANIZER, Role.ADMIN)
export class EventController {
  constructor(private readonly eventService: EventService) {}

  // ─── Event CRUD ───

  @Post()
  @ApiOperation({
    summary: 'Tạo mới sự kiện',
    description: 'Tạo một sự kiện mới với trạng thái DRAFT',
  })
  @ApiCreatedSuccessResponse(EventResponseDto, {
    description: 'Sự kiện được tạo thành công',
  })
  create(@Body() dto: CreateEventDto, @CurrentUser() user: User) {
    return this.eventService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({
    summary: 'Danh sách sự kiện',
    description: 'Lấy danh sách các sự kiện của người dùng (phân trang)',
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
  findAll(@Query() query: PaginationQueryDto, @CurrentUser() user: User) {
    return this.eventService.findAllByOrganizer(user.id, user.role, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Chi tiết sự kiện',
    description: 'Lấy thông tin chi tiết một sự kiện',
  })
  @ApiSuccessResponse(EventResponseDto, {
    description: 'Thông tin sự kiện',
  })
  findOne(@Param('id') id: string) {
    return this.eventService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Cập nhật sự kiện',
    description: 'Cập nhật thông tin sự kiện',
  })
  @ApiSuccessResponse(EventResponseDto, {
    description: 'Sự kiện được cập nhật thành công',
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @CurrentUser() user: User,
  ) {
    return this.eventService.update(id, dto, user.id, user.role);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Xóa sự kiện',
    description: 'Xóa sự kiện (chỉ khi ở trạng thái DRAFT)',
  })
  @ApiNoContentResponse({
    description: 'Sự kiện được xóa thành công',
  })
  delete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.eventService.delete(id, user.id, user.role);
  }

  @Post(':id/publish')
  @ApiOperation({
    summary: 'Xuất bản sự kiện',
    description: 'Chuyển sự kiện từ DRAFT sang PUBLISHED',
  })
  @ApiSuccessResponse(EventResponseDto, {
    description: 'Sự kiện được xuất bản thành công',
  })
  publish(@Param('id') id: string, @CurrentUser() user: User) {
    return this.eventService.publish(id, user.id, user.role);
  }

  @Post(':id/cancel')
  @ApiOperation({
    summary: 'Hủy sự kiện',
    description: 'Hủy sự kiện (từ PUBLISHED hoặc LIVE)',
  })
  @ApiSuccessResponse(EventResponseDto, {
    description: 'Sự kiện được hủy thành công',
  })
  cancel(@Param('id') id: string, @CurrentUser() user: User) {
    return this.eventService.cancel(id, user.id, user.role);
  }

  // ─── Descriptions ───

  @Post(':id/descriptions')
  @ApiOperation({
    summary: 'Thêm mô tả sự kiện',
    description: 'Thêm một khối mô tả mới cho sự kiện',
  })
  @ApiCreatedSuccessResponse(DescriptionResponseDto, {
    description: 'Mô tả được tạo thành công',
  })
  addDescription(
    @Param('id') id: string,
    @Body() dto: CreateDescriptionDto,
    @CurrentUser() user: User,
  ) {
    return this.eventService.addDescription(id, dto, user.id, user.role);
  }

  @Patch(':id/descriptions/:descId')
  @ApiOperation({
    summary: 'Cập nhật mô tả',
    description: 'Cập nhật nội dung mô tả sự kiện',
  })
  @ApiSuccessResponse(DescriptionResponseDto, {
    description: 'Mô tả được cập nhật thành công',
  })
  updateDescription(
    @Param('id') id: string,
    @Param('descId') descId: string,
    @Body() dto: UpdateDescriptionDto,
    @CurrentUser() user: User,
  ) {
    return this.eventService.updateDescription(
      id,
      descId,
      dto,
      user.id,
      user.role,
    );
  }

  @Delete(':id/descriptions/:descId')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Xóa mô tả',
    description: 'Xóa một khối mô tả',
  })
  @ApiNoContentResponse({
    description: 'Mô tả được xóa thành công',
  })
  deleteDescription(
    @Param('id') id: string,
    @Param('descId') descId: string,
    @CurrentUser() user: User,
  ) {
    return this.eventService.deleteDescription(id, descId, user.id, user.role);
  }

  @Patch(':id/descriptions/reorder')
  @ApiOperation({
    summary: 'Sắp xếp lại mô tả',
    description: 'Thay đổi thứ tự hiển thị của các mô tả',
  })
  @ApiNoContentResponse({
    description: 'Thứ tự được cập nhật thành công',
  })
  reorderDescriptions(
    @Param('id') id: string,
    @Body() dto: ReorderDto,
    @CurrentUser() user: User,
  ) {
    return this.eventService.reorderDescriptions(id, dto, user.id, user.role);
  }

  // ─── Sessions ───

  @Post(':id/sessions')
  @ApiOperation({
    summary: 'Tạo hạng mục thi đấu',
    description: 'Tạo một hạng mục thi đấu mới (ca thi đấu)',
  })
  @ApiCreatedSuccessResponse(SessionResponseDto, {
    description: 'Hạng mục được tạo thành công',
  })
  createSession(
    @Param('id') id: string,
    @Body() dto: CreateEventSessionDto,
    @CurrentUser() user: User,
  ) {
    return this.eventService.createSession(id, dto, user.id, user.role);
  }

  @Patch(':id/sessions/:sessionId')
  @ApiOperation({
    summary: 'Cập nhật hạng mục thi đấu',
    description: 'Cập nhật thông tin hạng mục thi đấu',
  })
  @ApiSuccessResponse(SessionResponseDto, {
    description: 'Hạng mục được cập nhật thành công',
  })
  updateSession(
    @Param('id') id: string,
    @Param('sessionId') sessionId: string,
    @Body() dto: UpdateEventSessionDto,
    @CurrentUser() user: User,
  ) {
    return this.eventService.updateSession(
      id,
      sessionId,
      dto,
      user.id,
      user.role,
    );
  }

  @Delete(':id/sessions/:sessionId')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Xóa hạng mục thi đấu',
    description: 'Xóa một hạng mục thi đấu',
  })
  @ApiNoContentResponse({
    description: 'Hạng mục được xóa thành công',
  })
  deleteSession(
    @Param('id') id: string,
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: User,
  ) {
    return this.eventService.deleteSession(id, sessionId, user.id, user.role);
  }

  // ─── Ticket Tiers ───

  @Post(':id/sessions/:sessionId/tickets')
  @ApiOperation({
    summary: 'Tạo loại vé',
    description: 'Tạo một loại vé mới cho hạng mục thi đấu',
  })
  @ApiCreatedSuccessResponse(TicketTierResponseDto, {
    description: 'Loại vé được tạo thành công',
  })
  createTicketTier(
    @Param('id') id: string,
    @Param('sessionId') sessionId: string,
    @Body() dto: CreateTicketTierDto,
    @CurrentUser() user: User,
  ) {
    return this.eventService.createTicketTier(
      id,
      sessionId,
      dto,
      user.id,
      user.role,
    );
  }

  @Patch(':id/sessions/:sessionId/tickets/:ticketId')
  @ApiOperation({
    summary: 'Cập nhật loại vé',
    description: 'Cập nhật thông tin loại vé',
  })
  @ApiSuccessResponse(TicketTierResponseDto, {
    description: 'Loại vé được cập nhật thành công',
  })
  updateTicketTier(
    @Param('id') id: string,
    @Param('sessionId') sessionId: string,
    @Param('ticketId') ticketId: string,
    @Body() dto: UpdateTicketTierDto,
    @CurrentUser() user: User,
  ) {
    return this.eventService.updateTicketTier(
      id,
      sessionId,
      ticketId,
      dto,
      user.id,
      user.role,
    );
  }

  @Delete(':id/sessions/:sessionId/tickets/:ticketId')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Xóa loại vé',
    description: 'Xóa một loại vé',
  })
  @ApiNoContentResponse({
    description: 'Loại vé được xóa thành công',
  })
  deleteTicketTier(
    @Param('id') id: string,
    @Param('sessionId') sessionId: string,
    @Param('ticketId') ticketId: string,
    @CurrentUser() user: User,
  ) {
    return this.eventService.deleteTicketTier(
      id,
      sessionId,
      ticketId,
      user.id,
      user.role,
    );
  }

  // ─── Custom Fields ───

  @Get(':id/fields')
  @ApiOperation({
    summary: 'Danh sách trường dữ liệu tùy chỉnh',
    description: 'Lấy tất cả câu hỏi trong form đăng ký của sự kiện',
  })
  @ApiSuccessResponse(CustomFieldResponseDto, {
    description: 'Danh sách trường dữ liệu',
    isArray: true,
  })
  getCustomFields(@Param('id') id: string) {
    return this.eventService.getCustomFields(id);
  }

  @Post(':id/fields')
  @ApiOperation({
    summary: 'Thêm trường dữ liệu tùy chỉnh',
    description: 'Thêm một câu hỏi mới trong form đăng ký',
  })
  @ApiCreatedSuccessResponse(CustomFieldResponseDto, {
    description: 'Trường dữ liệu được tạo thành công',
  })
  addCustomField(
    @Param('id') id: string,
    @Body() dto: CreateCustomFieldDto,
    @CurrentUser() user: User,
  ) {
    return this.eventService.addCustomField(id, dto, user.id, user.role);
  }

  @Patch(':id/fields/:fieldId')
  @ApiOperation({
    summary: 'Cập nhật trường dữ liệu',
    description: 'Cập nhật thông tin câu hỏi trong form đăng ký',
  })
  @ApiSuccessResponse(CustomFieldResponseDto, {
    description: 'Trường dữ liệu được cập nhật thành công',
  })
  updateCustomField(
    @Param('id') id: string,
    @Param('fieldId') fieldId: string,
    @Body() dto: UpdateCustomFieldDto,
    @CurrentUser() user: User,
  ) {
    return this.eventService.updateCustomField(
      id,
      fieldId,
      dto,
      user.id,
      user.role,
    );
  }

  @Delete(':id/fields/:fieldId')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Xóa trường dữ liệu',
    description: 'Xóa một câu hỏi (chỉ khi sự kiện ở trạng thái DRAFT)',
  })
  @ApiNoContentResponse({
    description: 'Trường dữ liệu được xóa thành công',
  })
  deleteCustomField(
    @Param('id') id: string,
    @Param('fieldId') fieldId: string,
    @CurrentUser() user: User,
  ) {
    return this.eventService.deleteCustomField(id, fieldId, user.id, user.role);
  }

  @Patch(':id/fields/reorder')
  @ApiOperation({
    summary: 'Sắp xếp lại trường dữ liệu',
    description: 'Thay đổi thứ tự hiển thị của các câu hỏi',
  })
  @ApiNoContentResponse({
    description: 'Thứ tự được cập nhật thành công',
  })
  reorderCustomFields(
    @Param('id') id: string,
    @Body() dto: ReorderDto,
    @CurrentUser() user: User,
  ) {
    return this.eventService.reorderCustomFields(id, dto, user.id, user.role);
  }

  // ─── Scoring Config ───

  @Put(':id/scoring-config')
  @ApiOperation({
    summary: 'Cấu hình luật thi đấu',
    description: 'Thiết lập các luật tính điểm dựa trên loại thể thao',
  })
  @ApiSuccessResponse(EventResponseDto, {
    description: 'Cấu hình được lưu thành công',
  })
  saveScoringConfig(
    @Param('id') id: string,
    @Body() dto: ScoringConfigDto,
    @CurrentUser() user: User,
  ) {
    return this.eventService.saveScoringConfig(id, dto, user.id, user.role);
  }

  @Get(':id/scoring-config')
  @ApiOperation({
    summary: 'Lấy cấu hình luật thi đấu',
    description: 'Lấy thông tin cấu hình luật thi đấu của sự kiện',
  })
  @ApiSuccessResponse(null, {
    description: 'Cấu hình luật thi đấu',
    schema: {
      properties: {
        sportType: { type: 'string' },
        scoringMode: { type: 'string' },
        matchFormat: { type: 'string' },
        pointsToWin: { type: 'number' },
        winByTwo: { type: 'boolean' },
      },
    },
  })
  getScoringConfig(@Param('id') id: string) {
    return this.eventService.getScoringConfig(id);
  }

  // ─── Blacklist ───

  @Put(':id/blacklist')
  @ApiOperation({
    summary: 'Cập nhật danh sách chặn',
    description: 'Thay thế danh sách email/SĐT bị chặn',
  })
  @ApiSuccessResponse(BlacklistResponseDto, {
    description: 'Danh sách chặn được cập nhật thành công',
    isArray: true,
  })
  setBlacklist(
    @Param('id') id: string,
    @Body() dto: SetBlacklistDto,
    @CurrentUser() user: User,
  ) {
    return this.eventService.setBlacklist(id, dto, user.id, user.role);
  }

  @Get(':id/blacklist')
  @ApiOperation({
    summary: 'Lấy danh sách chặn',
    description: 'Lấy tất cả email/SĐT bị chặn',
  })
  @ApiSuccessResponse(BlacklistResponseDto, {
    description: 'Danh sách chặn',
    isArray: true,
  })
  getBlacklist(@Param('id') id: string) {
    return this.eventService.getBlacklist(id);
  }
}
