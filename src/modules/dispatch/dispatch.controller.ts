import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { DispatchService, AutoAssignPreview } from './dispatch.service';
import {
  AssignMatchDto,
  UnassignMatchDto,
  SwapCourtDto,
  MatchQueueQueryDto,
} from './dto';
import { Match } from '../event/entities/match.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards';
import { Roles } from 'src/common/decorators';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('dispatch')
@Controller('events/:eventId/dispatch')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.ORGANIZER)
@ApiBearerAuth()
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  @Get('queue')
  @ApiOperation({ summary: 'Get match queue (pending matches)' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Pending matches list' })
  async getQueue(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Query() query: MatchQueueQueryDto,
  ): Promise<{ data: Match[]; total: number }> {
    return this.dispatchService.getMatchQueue(
      eventId,
      query.sessionId,
      query.page,
      query.limit,
    );
  }

  @Post('assign')
  @ApiOperation({ summary: 'Assign match to court' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Match assigned', type: Match })
  async assign(@Body() dto: AssignMatchDto): Promise<Match> {
    return this.dispatchService.assignMatchToCourt(dto.matchId, dto.courtId);
  }

  @Post('unassign')
  @ApiOperation({ summary: 'Unassign match from court' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Match unassigned', type: Match })
  async unassign(@Body() dto: UnassignMatchDto): Promise<Match> {
    return this.dispatchService.unassignMatch(dto.matchId);
  }

  @Post('auto-assign')
  @ApiOperation({
    summary: 'Auto-assign pending matches to available courts',
  })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiQuery({
    name: 'sessionId',
    required: false,
    description: 'Filter by session',
  })
  @ApiQuery({
    name: 'confirm',
    required: false,
    description: 'Set to true to execute assignments',
  })
  @ApiResponse({ status: 200, description: 'Auto-assign preview or result' })
  async autoAssign(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Query('sessionId') sessionId?: string,
    @Query('confirm') confirm?: string,
  ): Promise<AutoAssignPreview | Match[]> {
    return this.dispatchService.autoAssign(
      eventId,
      sessionId,
      confirm === 'true',
    );
  }

  @Post('swap-court')
  @ApiOperation({ summary: 'Swap court for an active match' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Court swapped', type: Match })
  async swapCourt(@Body() dto: SwapCourtDto): Promise<Match> {
    return this.dispatchService.swapCourt(dto.matchId, dto.newCourtId);
  }
}
