import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Athlete, AthleteStats } from './entities';
import { CreateAthleteDto, UpdateAthleteDto, AthleteQueryDto } from './dto';

@Injectable()
export class AthleteService {
  constructor(
    @InjectRepository(Athlete)
    private readonly athleteRepository: Repository<Athlete>,
    @InjectRepository(AthleteStats)
    private readonly statsRepository: Repository<AthleteStats>,
  ) {}

  async create(
    createAthleteDto: CreateAthleteDto,
    userId: string,
  ): Promise<Athlete> {
    // Check if athlete already exists for this user and sport
    const existing = await this.athleteRepository.findOne({
      where: {
        userId,
        sportType: createAthleteDto.sportType,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Athlete profile for ${createAthleteDto.sportType} already exists`,
      );
    }

    const athlete = this.athleteRepository.create({
      ...createAthleteDto,
      userId,
    });

    return await this.athleteRepository.save(athlete);
  }

  async findAll(query: AthleteQueryDto) {
    const {
      page = 1,
      limit = 20,
      sportType,
      search,
      city,
      isActive,
      isVerified,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const where: FindOptionsWhere<Athlete> = {};

    if (sportType) {
      where.sportType = sportType;
    }

    if (search) {
      where.name = Like(`%${search}%`);
    }

    if (city) {
      where.city = city;
    }

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    if (typeof isVerified === 'boolean') {
      where.isVerified = isVerified;
    }

    const [athletes, total] = await this.athleteRepository.findAndCount({
      where,
      relations: ['user'],
      order: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: athletes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Athlete> {
    const athlete = await this.athleteRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!athlete) {
      throw new NotFoundException(`Athlete with ID ${id} not found`);
    }

    return athlete;
  }

  async findByUser(userId: string, sportType?: string) {
    const where: FindOptionsWhere<Athlete> = { userId };

    if (sportType) {
      where.sportType = sportType as any;
    }

    return await this.athleteRepository.find({
      where,
      relations: ['user'],
    });
  }

  async update(
    id: string,
    updateAthleteDto: UpdateAthleteDto,
    userId: string,
  ): Promise<Athlete> {
    const athlete = await this.findOne(id);

    // Check ownership
    if (athlete.userId !== userId) {
      throw new ForbiddenException('You can only update your own profile');
    }

    Object.assign(athlete, updateAthleteDto);

    return await this.athleteRepository.save(athlete);
  }

  async remove(id: string, userId: string): Promise<void> {
    const athlete = await this.findOne(id);

    // Check ownership
    if (athlete.userId !== userId) {
      throw new ForbiddenException('You can only delete your own profile');
    }

    await this.athleteRepository.softRemove(athlete);
  }

  async getStats(
    id: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<AthleteStats[]> {
    const athlete = await this.findOne(id);

    const query = this.statsRepository
      .createQueryBuilder('stats')
      .where('stats.athleteId = :athleteId', { athleteId: athlete.id })
      .orderBy('stats.date', 'ASC');

    if (startDate) {
      query.andWhere('stats.date >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('stats.date <= :endDate', { endDate });
    }

    return await query.getMany();
  }

  async recordStats(
    athleteId: string,
    date: Date,
    stats: {
      rating: number;
      matchesPlayed: number;
      wins: number;
      losses: number;
      eventsParticipated?: number;
    },
  ): Promise<AthleteStats> {
    // Check if stats for this date already exist
    let athleteStats = await this.statsRepository.findOne({
      where: { athleteId, date },
    });

    if (athleteStats) {
      // Update existing stats
      Object.assign(athleteStats, stats);
    } else {
      // Create new stats record
      athleteStats = this.statsRepository.create({
        athleteId,
        date,
        ...stats,
      });
    }

    return await this.statsRepository.save(athleteStats);
  }

  async updateStatsAfterMatch(
    athleteId: string,
    won: boolean,
    newRating?: number,
  ): Promise<void> {
    const athlete = await this.findOne(athleteId);

    // Update athlete's stats
    athlete.totalMatches += 1;
    if (won) {
      athlete.wins += 1;
    } else {
      athlete.losses += 1;
    }

    // Calculate win rate
    athlete.winRate =
      athlete.totalMatches > 0
        ? (athlete.wins / athlete.totalMatches) * 100
        : 0;

    // Update rating if provided
    if (newRating !== undefined) {
      athlete.currentRating = newRating;
      if (newRating > athlete.peakRating) {
        athlete.peakRating = newRating;
      }
    }

    await this.athleteRepository.save(athlete);

    // Record daily stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.recordStats(athleteId, today, {
      rating: athlete.currentRating,
      matchesPlayed: 1,
      wins: won ? 1 : 0,
      losses: won ? 0 : 1,
    });
  }

  async search(term: string, sportType?: string) {
    const query = this.athleteRepository
      .createQueryBuilder('athlete')
      .where('athlete.isActive = :isActive', { isActive: true })
      .andWhere('athlete.name ILIKE :term', { term: `%${term}%` });

    if (sportType) {
      query.andWhere('athlete.sportType = :sportType', { sportType });
    }

    return await query.limit(10).getMany();
  }
}
