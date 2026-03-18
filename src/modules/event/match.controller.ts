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
} from '@nestjs/swagger';
import { MatchService } from './match.service';
import { CreateMatchDto, UpdateMatchDto, UpdateScoreDto } from './dto/match';
import { Match, MatchScore } from './entities';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards';
import { Roles } from 'src/common/decorators';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('matches')
@Controller('events/:eventId/matches')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create match' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({
    status: 201,
    description: 'Match created successfully',
    type: Match,
  })
  async create(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() createMatchDto: CreateMatchDto,
  ): Promise<Match> {
    return await this.matchService.create(eventId, createMatchDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all matches for event' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns all matches',
    type: [Match],
  })
  async findAll(
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ): Promise<Match[]> {
    return await this.matchService.findAllByEvent(eventId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get match by ID' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'id', description: 'Match ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns match details',
    type: Match,
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Match> {
    return await this.matchService.findOne(id);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start match' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'id', description: 'Match ID' })
  @ApiResponse({
    status: 200,
    description: 'Match started',
    type: Match,
  })
  async start(@Param('id', ParseUUIDPipe) id: string): Promise<Match> {
    return await this.matchService.startMatch(id);
  }

  @Post(':id/end')
  @ApiOperation({ summary: 'End match' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'id', description: 'Match ID' })
  @ApiResponse({
    status: 200,
    description: 'Match ended',
    type: Match,
  })
  async end(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('winnerTeam') winnerTeam?: number,
  ): Promise<Match> {
    return await this.matchService.endMatch(id, winnerTeam);
  }

  @Patch(':id/score')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update match score' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'id', description: 'Match ID' })
  @ApiResponse({
    status: 200,
    description: 'Score updated',
    type: MatchScore,
  })
  async updateScore(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateScoreDto: UpdateScoreDto,
  ): Promise<MatchScore> {
    return await this.matchService.updateScore(id, updateScoreDto);
  }

  @Get(':id/scores')
  @ApiOperation({ summary: 'Get match scores' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'id', description: 'Match ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns match scores',
    type: [MatchScore],
  })
  async getScores(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MatchScore[]> {
    return await this.matchService.getScores(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update match' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'id', description: 'Match ID' })
  @ApiResponse({
    status: 200,
    description: 'Match updated',
    type: Match,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMatchDto: UpdateMatchDto,
  ): Promise<Match> {
    return await this.matchService.update(id, updateMatchDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete match' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'id', description: 'Match ID' })
  @ApiResponse({
    status: 200,
    description: 'Match deleted',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return await this.matchService.remove(id);
  }
}
