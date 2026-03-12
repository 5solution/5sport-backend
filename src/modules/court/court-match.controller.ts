import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CourtAccessGuard } from './guards/court-access.guard';
import { CurrentCourt } from './decorators/current-court.decorator';
import { Match, MatchStatus } from '../event/entities/match.entity';
import { MatchService } from '../event/match.service';

@ApiTags('court-matches')
@Controller('court/matches')
@UseGuards(CourtAccessGuard)
@ApiBearerAuth()
export class CourtMatchController {
  constructor(
    private readonly matchService: MatchService,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get matches assigned to this court' })
  @ApiResponse({ status: 200, description: 'Matches on this court', type: [Match] })
  async getMyMatches(
    @CurrentCourt('courtId') courtId: string,
  ): Promise<Match[]> {
    return this.matchRepository.find({
      where: {
        courtId,
        status: In([
          MatchStatus.SCHEDULED,
          MatchStatus.WARM_UP,
          MatchStatus.IN_PROGRESS,
        ]),
      },
      relations: ['scores'],
      order: { scheduledTime: 'ASC' },
    });
  }

  @Post(':matchId/warm-up')
  @ApiOperation({ summary: 'Start warm-up phase' })
  @ApiParam({ name: 'matchId', description: 'Match ID' })
  @ApiResponse({ status: 200, description: 'Match in warm-up', type: Match })
  async startWarmUp(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @CurrentCourt('courtId') courtId: string,
  ): Promise<Match> {
    const match = await this.matchService.findOne(matchId);
    this.validateCourtAccess(match, courtId);

    if (match.status !== MatchStatus.SCHEDULED) {
      throw new BadRequestException(
        'Warm-up can only be started from SCHEDULED status',
      );
    }

    match.status = MatchStatus.WARM_UP;
    return this.matchRepository.save(match);
  }

  @Post(':matchId/start')
  @ApiOperation({ summary: 'Start match (from SCHEDULED or WARM_UP)' })
  @ApiParam({ name: 'matchId', description: 'Match ID' })
  @ApiResponse({ status: 200, description: 'Match started', type: Match })
  async startMatch(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @CurrentCourt('courtId') courtId: string,
  ): Promise<Match> {
    const match = await this.matchService.findOne(matchId);
    this.validateCourtAccess(match, courtId);

    if (
      match.status !== MatchStatus.SCHEDULED &&
      match.status !== MatchStatus.WARM_UP
    ) {
      throw new BadRequestException(
        'Match can only be started from SCHEDULED or WARM_UP status',
      );
    }

    match.status = MatchStatus.IN_PROGRESS;
    match.startTime = new Date();
    return this.matchRepository.save(match);
  }

  @Post(':matchId/end')
  @ApiOperation({ summary: 'End match and record winner' })
  @ApiParam({ name: 'matchId', description: 'Match ID' })
  @ApiResponse({ status: 200, description: 'Match ended', type: Match })
  async endMatch(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @CurrentCourt('courtId') courtId: string,
    @Body('winnerTeam') winnerTeam?: number,
  ): Promise<Match> {
    const match = await this.matchService.findOne(matchId);
    this.validateCourtAccess(match, courtId);

    return this.matchService.endMatch(matchId, winnerTeam);
  }

  @Patch(':matchId/score')
  @ApiOperation({ summary: 'Update set score' })
  @ApiParam({ name: 'matchId', description: 'Match ID' })
  @ApiResponse({ status: 200, description: 'Score updated' })
  async updateScore(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @CurrentCourt('courtId') courtId: string,
    @Body() updateScoreDto: any,
  ): Promise<any> {
    const match = await this.matchService.findOne(matchId);
    this.validateCourtAccess(match, courtId);

    return this.matchService.updateScore(matchId, updateScoreDto);
  }

  private validateCourtAccess(match: Match, courtId: string): void {
    if (match.courtId !== courtId) {
      throw new BadRequestException(
        'This match is not assigned to your court',
      );
    }
  }
}
