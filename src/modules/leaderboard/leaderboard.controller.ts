import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { LeaderboardService } from './leaderboard.service';
import {
  CreateLeaderboardDto,
  UpdateLeaderboardDto,
  LeaderboardQueryDto,
} from './dto';
import { Leaderboard, LeaderboardEntry } from './entities';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards';
import { Roles } from 'src/common/decorators';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('leaderboards')
@Controller('leaderboards')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create leaderboard (Admin/Organizer only)' })
  @ApiResponse({
    status: 201,
    description: 'Leaderboard created successfully',
    type: Leaderboard,
  })
  async create(
    @Body() createLeaderboardDto: CreateLeaderboardDto,
  ): Promise<Leaderboard> {
    return await this.leaderboardService.create(createLeaderboardDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all leaderboards with filters' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated leaderboards',
    type: [Leaderboard],
  })
  async findAll(@Query() query: LeaderboardQueryDto) {
    return await this.leaderboardService.findAll(query);
  }

  @Get('top/:sportType')
  @ApiOperation({ summary: 'Get top athletes by sport' })
  @ApiParam({ name: 'sportType', description: 'Sport type' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of top athletes',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns top athletes',
    type: [LeaderboardEntry],
  })
  async getTopAthletes(
    @Param('sportType') sportType: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return await this.leaderboardService.getTopAthletes(sportType, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get leaderboard by ID' })
  @ApiParam({ name: 'id', description: 'Leaderboard ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns leaderboard details with entries',
    type: Leaderboard,
  })
  @ApiResponse({ status: 404, description: 'Leaderboard not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Leaderboard> {
    return await this.leaderboardService.findOne(id);
  }

  @Get(':id/entries')
  @ApiOperation({ summary: 'Get leaderboard entries with pagination' })
  @ApiParam({ name: 'id', description: 'Leaderboard ID' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated entries',
    type: [LeaderboardEntry],
  })
  async getEntries(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return await this.leaderboardService.getEntries(id, page, limit);
  }

  @Get(':id/athlete/:athleteId')
  @ApiOperation({ summary: 'Get athlete rank in leaderboard' })
  @ApiParam({ name: 'id', description: 'Leaderboard ID' })
  @ApiParam({ name: 'athleteId', description: 'Athlete ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns athlete entry',
    type: LeaderboardEntry,
  })
  async getAthleteRank(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('athleteId', ParseUUIDPipe) athleteId: string,
  ) {
    return await this.leaderboardService.getAthleteRank(id, athleteId);
  }

  @Post(':id/calculate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Recalculate leaderboard rankings' })
  @ApiParam({ name: 'id', description: 'Leaderboard ID' })
  @ApiResponse({
    status: 200,
    description: 'Rankings recalculated successfully',
    type: [LeaderboardEntry],
  })
  async calculateRankings(@Param('id', ParseUUIDPipe) id: string) {
    return await this.leaderboardService.calculateRankings(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update leaderboard' })
  @ApiParam({ name: 'id', description: 'Leaderboard ID' })
  @ApiResponse({
    status: 200,
    description: 'Leaderboard updated successfully',
    type: Leaderboard,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateLeaderboardDto: UpdateLeaderboardDto,
  ): Promise<Leaderboard> {
    return await this.leaderboardService.update(id, updateLeaderboardDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete leaderboard (Admin only)' })
  @ApiParam({ name: 'id', description: 'Leaderboard ID' })
  @ApiResponse({
    status: 200,
    description: 'Leaderboard deleted successfully',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return await this.leaderboardService.remove(id);
  }
}
