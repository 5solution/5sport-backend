import { Body, Controller, Get, Param, ParseIntPipe, ParseUUIDPipe, Put } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MatchService } from './match.service';
import { UpsertMatchScoreDto } from './dto/match';
import { MatchScore } from './entities';

@ApiTags('match-scores')
@Controller('matches/:matchId/scores')
export class MatchScoreController {
  constructor(private readonly matchService: MatchService) {}

  @Get()
  @ApiOperation({ summary: 'Get all scores of a match' })
  @ApiParam({ name: 'matchId', description: 'Match ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns all scores for the match ordered by set number',
    type: [MatchScore],
  })
  async findAll(
    @Param('matchId', ParseUUIDPipe) matchId: string,
  ): Promise<MatchScore[]> {
    return await this.matchService.getScores(matchId);
  }

  @Put(':setNumber')
  @ApiOperation({
    summary: 'Create or update a match score',
    description:
      'Creates or updates the score for a specific set. Match must be IN_PROGRESS. ' +
      'Set N can only be created after set N-1 exists.',
  })
  @ApiParam({ name: 'matchId', description: 'Match ID' })
  @ApiParam({ name: 'setNumber', description: 'Set number (1-based)', example: 1 })
  @ApiBody({ type: UpsertMatchScoreDto })
  @ApiResponse({ status: 200, description: 'Score created or updated', type: MatchScore })
  @ApiResponse({ status: 400, description: 'Match not IN_PROGRESS or previous set missing' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  async upsert(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @Param('setNumber', ParseIntPipe) setNumber: number,
    @Body() dto: UpsertMatchScoreDto,
  ): Promise<MatchScore> {
    return await this.matchService.upsertScore(matchId, setNumber, dto);
  }
}
