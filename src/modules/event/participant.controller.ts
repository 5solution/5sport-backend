import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ParticipantService } from './participant.service';
import { CreateParticipantDto } from './dto/participant/create-participant.dto';
import { EventParticipant } from './entities';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards';
import { Roles, CurrentUser } from 'src/common/decorators';
import { Role } from 'src/common/enums/role.enum';
import { User } from '../user/user.entity';

@ApiTags('participants')
@Controller('events/:eventId/participants')
export class ParticipantController {
  constructor(private readonly participantService: ParticipantService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register participant for event' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({
    status: 201,
    description: 'Participant registered successfully',
    type: EventParticipant,
  })
  async create(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() createDto: CreateParticipantDto,
    @CurrentUser() user: User,
  ): Promise<EventParticipant> {
    return await this.participantService.create(createDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all participants for event' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns all participants',
    type: [EventParticipant],
  })
  async findAll(
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ): Promise<EventParticipant[]> {
    return await this.participantService.findAllByEvent(eventId);
  }

  @Get('checked-in')
  @ApiOperation({ summary: 'Get checked-in participants' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns checked-in participants',
    type: [EventParticipant],
  })
  async getCheckedIn(
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ): Promise<EventParticipant[]> {
    return await this.participantService.getCheckedInParticipants(eventId);
  }

  @Get('stage/:stageId')
  @ApiOperation({ summary: 'Get participants by stage' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'stageId', description: 'Stage ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns participants belonging to the stage session',
    type: [EventParticipant],
  })
  async findByStage(
    @Param('stageId', ParseUUIDPipe) stageId: string,
  ): Promise<EventParticipant[]> {
    return this.participantService.findAllByStage(stageId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get participant by ID' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'id', description: 'Participant ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns participant details',
    type: EventParticipant,
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EventParticipant> {
    return await this.participantService.findOne(id);
  }

  @Post(':id/checkin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check-in participant' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'id', description: 'Participant ID' })
  @ApiResponse({
    status: 200,
    description: 'Participant checked in',
    type: EventParticipant,
  })
  async checkin(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EventParticipant> {
    return await this.participantService.checkin(id);
  }

  @Post(':id/withdraw')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Withdraw from event' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'id', description: 'Participant ID' })
  @ApiResponse({
    status: 200,
    description: 'Participant withdrawn',
    type: EventParticipant,
  })
  async withdraw(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<EventParticipant> {
    return await this.participantService.withdraw(id, user.id);
  }

  @Patch(':id/partner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign partner for a doubles participant' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'id', description: 'Participant ID' })
  @ApiBody({
    description: 'Partner participant ID',
    schema: {
      type: 'object',
      properties: {
        partnerParticipantId: {
          type: 'string',
          format: 'uuid',
          description: 'UUID of the partner participant',
          example: '550e8400-e29b-41d4-a716-446655440000',
        },
      },
      required: ['partnerParticipantId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Partner assigned — both participants updated to PAIRED',
    type: EventParticipant,
  })
  async assignPartner(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('partnerParticipantId', ParseUUIDPipe) partnerParticipantId: string,
  ): Promise<EventParticipant> {
    return this.participantService.assignPartner(id, partnerParticipantId);
  }

  @Delete(':id/partner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove partner from a doubles participant' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'id', description: 'Participant ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner removed — both participants reverted to FINDING_PARTNER',
    type: EventParticipant,
  })
  async removePartner(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EventParticipant> {
    return this.participantService.removePartner(id);
  }

  @Patch(':id/bib')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign bib number' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'id', description: 'Participant ID' })
  @ApiResponse({
    status: 200,
    description: 'Bib number assigned',
    type: EventParticipant,
  })
  async assignBib(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('bibNumber') bibNumber: string,
  ): Promise<EventParticipant> {
    return await this.participantService.assignBibNumber(id, bibNumber);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove participant' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'id', description: 'Participant ID' })
  @ApiResponse({
    status: 200,
    description: 'Participant removed',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return await this.participantService.remove(id);
  }
}
