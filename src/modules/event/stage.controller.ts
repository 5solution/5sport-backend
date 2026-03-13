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
import { StageService } from './stage.service';
import { CreateStageDto } from './dto/stage/create-stage.dto';
import { UpdateStageDto } from './dto/stage/update-stage.dto';
import { Stage } from './entities/stage.entity';
import { Match } from './entities/match.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards';
import { Roles } from 'src/common/decorators';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('stages')
@Controller('events/:eventId')
export class StageController {
  constructor(private readonly stageService: StageService) {}

  @Post('sessions/:sessionId/stages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create stage for session' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({
    status: 201,
    description: 'Stage created successfully',
    type: Stage,
  })
  async create(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() createStageDto: CreateStageDto,
  ): Promise<Stage> {
    return await this.stageService.create(sessionId, createStageDto);
  }

  @Get('sessions/:sessionId/stages')
  @ApiOperation({ summary: 'Get all stages for session' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns all stages',
    type: [Stage],
  })
  async findAllBySession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ): Promise<Stage[]> {
    return await this.stageService.findAllBySession(sessionId);
  }

  @Get('stages/:stageId')
  @ApiOperation({ summary: 'Get stage by ID' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'stageId', description: 'Stage ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns stage details with matches',
    type: Stage,
  })
  async findOne(
    @Param('stageId', ParseUUIDPipe) stageId: string,
  ): Promise<Stage> {
    return await this.stageService.findOne(stageId);
  }

  @Patch('stages/:stageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update stage' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'stageId', description: 'Stage ID' })
  @ApiResponse({
    status: 200,
    description: 'Stage updated',
    type: Stage,
  })
  async update(
    @Param('stageId', ParseUUIDPipe) stageId: string,
    @Body() updateStageDto: UpdateStageDto,
  ): Promise<Stage> {
    return await this.stageService.update(stageId, updateStageDto);
  }

  @Delete('stages/:stageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete stage' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'stageId', description: 'Stage ID' })
  @ApiResponse({
    status: 200,
    description: 'Stage deleted',
  })
  async remove(
    @Param('stageId', ParseUUIDPipe) stageId: string,
  ): Promise<void> {
    return await this.stageService.remove(stageId);
  }

  @Get('stages/:stageId/matches')
  @ApiOperation({ summary: 'Get all matches for a stage' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'stageId', description: 'Stage ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns all matches for the stage',
    type: [Match],
  })
  async findMatchesByStage(
    @Param('stageId', ParseUUIDPipe) stageId: string,
  ): Promise<Match[]> {
    return await this.stageService.findMatchesByStage(stageId);
  }

  @Post('stages/:stageId/generate-matches')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Generate matches for stage based on tournament type',
  })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'stageId', description: 'Stage ID' })
  @ApiResponse({
    status: 201,
    description: 'Matches generated successfully',
    type: [Match],
  })
  async generateMatches(
    @Param('stageId', ParseUUIDPipe) stageId: string,
  ): Promise<Match[]> {
    return await this.stageService.generateMatches(stageId);
  }

  @Post('stages/:stageId/advance-winners')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Advance winners to next round/stage' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'stageId', description: 'Stage ID' })
  @ApiResponse({
    status: 201,
    description: 'Winners advanced',
    type: [Match],
  })
  async advanceWinners(
    @Param('stageId', ParseUUIDPipe) stageId: string,
  ): Promise<Match[]> {
    return await this.stageService.advanceWinners(stageId);
  }
}
