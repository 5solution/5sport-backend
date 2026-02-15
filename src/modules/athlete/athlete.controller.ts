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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AthleteService } from './athlete.service';
import { CreateAthleteDto, UpdateAthleteDto, AthleteQueryDto } from './dto';
import { Athlete, AthleteStats } from './entities';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators';
import { User } from '../user/user.entity';

@ApiTags('athletes')
@Controller('athletes')
export class AthleteController {
  constructor(private readonly athleteService: AthleteService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create athlete profile' })
  @ApiResponse({
    status: 201,
    description: 'Athlete profile created successfully',
    type: Athlete,
  })
  @ApiResponse({ status: 409, description: 'Profile already exists' })
  async create(
    @Body() createAthleteDto: CreateAthleteDto,
    @CurrentUser() user: User,
  ): Promise<Athlete> {
    return await this.athleteService.create(createAthleteDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all athletes with filters' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated athletes',
    type: [Athlete],
  })
  async findAll(@Query() query: AthleteQueryDto) {
    return await this.athleteService.findAll(query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search athletes by name' })
  @ApiQuery({
    name: 'term',
    required: true,
    description: 'Search term',
  })
  @ApiQuery({
    name: 'sportType',
    required: false,
    description: 'Filter by sport type',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns matching athletes',
    type: [Athlete],
  })
  async search(
    @Query('term') term: string,
    @Query('sportType') sportType?: string,
  ) {
    return await this.athleteService.search(term, sportType);
  }

  @Get('my-profiles')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my athlete profiles' })
  @ApiResponse({
    status: 200,
    description: 'Returns user athlete profiles',
    type: [Athlete],
  })
  async getMyProfiles(@CurrentUser() user: User) {
    return await this.athleteService.findByUser(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get athlete by ID' })
  @ApiParam({ name: 'id', description: 'Athlete ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns athlete details',
    type: Athlete,
  })
  @ApiResponse({ status: 404, description: 'Athlete not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Athlete> {
    return await this.athleteService.findOne(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get athlete statistics history' })
  @ApiParam({ name: 'id', description: 'Athlete ID' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date (ISO format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date (ISO format)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns athlete statistics',
    type: [AthleteStats],
  })
  async getStats(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<AthleteStats[]> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.athleteService.getStats(id, start, end);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update athlete profile' })
  @ApiParam({ name: 'id', description: 'Athlete ID' })
  @ApiResponse({
    status: 200,
    description: 'Athlete updated successfully',
    type: Athlete,
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Athlete not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAthleteDto: UpdateAthleteDto,
    @CurrentUser() user: User,
  ): Promise<Athlete> {
    return await this.athleteService.update(id, updateAthleteDto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete athlete profile' })
  @ApiParam({ name: 'id', description: 'Athlete ID' })
  @ApiResponse({
    status: 200,
    description: 'Athlete deleted successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Athlete not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return await this.athleteService.remove(id, user.id);
  }
}
