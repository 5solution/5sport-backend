import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CourtService, CourtGridItem } from './court.service';
import { CreateCourtsBulkDto, CreateCourtDto, UpdateCourtDto } from './dto';
import { Court } from './entities/court.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards';
import { Roles } from 'src/common/decorators';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('courts')
@Controller('events/:eventId/courts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.ORGANIZER)
@ApiBearerAuth()
export class CourtController {
  constructor(private readonly courtService: CourtService) {}

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk create courts' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({ status: 201, description: 'Courts created', type: [Court] })
  async bulkCreate(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: CreateCourtsBulkDto,
  ): Promise<Court[]> {
    return this.courtService.bulkCreate(eventId, dto.count);
  }

  @Post()
  @ApiOperation({ summary: 'Create a single court' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({ status: 201, description: 'Court created', type: Court })
  async create(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: CreateCourtDto,
  ): Promise<Court> {
    return this.courtService.addOne(eventId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all courts for event' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Courts list', type: [Court] })
  async findAll(
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ): Promise<Court[]> {
    return this.courtService.findAllByEvent(eventId);
  }

  @Get('grid')
  @ApiOperation({ summary: 'Get court grid with operational status' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Court grid with status' })
  async getGrid(
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ): Promise<CourtGridItem[]> {
    return this.courtService.getCourtGrid(eventId);
  }

  @Get(':courtId')
  @ApiOperation({ summary: 'Get court by ID' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'courtId', description: 'Court ID' })
  @ApiResponse({ status: 200, description: 'Court details', type: Court })
  async findOne(
    @Param('courtId', ParseUUIDPipe) courtId: string,
  ): Promise<Court> {
    return this.courtService.findOne(courtId);
  }

  @Patch(':courtId')
  @ApiOperation({ summary: 'Update court' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'courtId', description: 'Court ID' })
  @ApiResponse({ status: 200, description: 'Court updated', type: Court })
  async update(
    @Param('courtId', ParseUUIDPipe) courtId: string,
    @Body() dto: UpdateCourtDto,
  ): Promise<Court> {
    return this.courtService.update(courtId, dto);
  }

  @Delete(':courtId')
  @ApiOperation({ summary: 'Delete court' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'courtId', description: 'Court ID' })
  @ApiResponse({ status: 200, description: 'Court deleted' })
  async remove(
    @Param('courtId', ParseUUIDPipe) courtId: string,
  ): Promise<void> {
    return this.courtService.remove(courtId);
  }

  @Get(':courtId/qr')
  @ApiOperation({ summary: 'Get QR code data for court' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'courtId', description: 'Court ID' })
  @ApiResponse({ status: 200, description: 'QR token and URL' })
  async getQr(
    @Param('courtId', ParseUUIDPipe) courtId: string,
  ): Promise<{ token: string; url: string }> {
    return this.courtService.getQrPayload(courtId);
  }

  @Post(':courtId/rotate-qr')
  @ApiOperation({ summary: 'Rotate QR secret (invalidates old QR)' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'courtId', description: 'Court ID' })
  @ApiResponse({ status: 200, description: 'New QR token and URL' })
  async rotateQr(
    @Param('courtId', ParseUUIDPipe) courtId: string,
  ): Promise<{ token: string; url: string }> {
    return this.courtService.rotateSecret(courtId);
  }
}
