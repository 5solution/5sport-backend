import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between } from 'typeorm';
import { Leaderboard, LeaderboardEntry } from './entities';
import {
  CreateLeaderboardDto,
  UpdateLeaderboardDto,
  LeaderboardQueryDto,
} from './dto';
import { Athlete } from '../athlete/entities';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(Leaderboard)
    private readonly leaderboardRepository: Repository<Leaderboard>,
    @InjectRepository(LeaderboardEntry)
    private readonly entryRepository: Repository<LeaderboardEntry>,
    @InjectRepository(Athlete)
    private readonly athleteRepository: Repository<Athlete>,
  ) {}

  async create(
    createLeaderboardDto: CreateLeaderboardDto,
  ): Promise<Leaderboard> {
    const leaderboard = this.leaderboardRepository.create(createLeaderboardDto);
    return await this.leaderboardRepository.save(leaderboard);
  }

  async findAll(query: LeaderboardQueryDto) {
    const { page = 1, limit = 20, sportType, type, eventId, isActive } = query;

    const where: FindOptionsWhere<Leaderboard> = {};

    if (sportType) {
      where.sportType = sportType;
    }

    if (type) {
      where.type = type;
    }

    if (eventId) {
      where.eventId = eventId;
    }

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    const [leaderboards, total] = await this.leaderboardRepository.findAndCount(
      {
        where,
        order: {
          created_at: 'DESC',
        },
        skip: (page - 1) * limit,
        take: limit,
      },
    );

    return {
      data: leaderboards,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Leaderboard> {
    const leaderboard = await this.leaderboardRepository.findOne({
      where: { id },
      relations: ['entries', 'entries.athlete', 'entries.athlete.user'],
    });

    if (!leaderboard) {
      throw new NotFoundException(`Leaderboard with ID ${id} not found`);
    }

    // Sort entries by rank
    if (leaderboard.entries) {
      leaderboard.entries.sort((a, b) => a.rank - b.rank);
    }

    return leaderboard;
  }

  async update(
    id: string,
    updateLeaderboardDto: UpdateLeaderboardDto,
  ): Promise<Leaderboard> {
    const leaderboard = await this.findOne(id);
    Object.assign(leaderboard, updateLeaderboardDto);
    return await this.leaderboardRepository.save(leaderboard);
  }

  async remove(id: string): Promise<void> {
    const leaderboard = await this.findOne(id);
    await this.leaderboardRepository.remove(leaderboard);
  }

  async getEntries(leaderboardId: string, page = 1, limit = 50) {
    const leaderboard = await this.leaderboardRepository.findOne({
      where: { id: leaderboardId },
    });

    if (!leaderboard) {
      throw new NotFoundException(
        `Leaderboard with ID ${leaderboardId} not found`,
      );
    }

    const [entries, total] = await this.entryRepository.findAndCount({
      where: { leaderboardId },
      relations: ['athlete', 'athlete.user'],
      order: {
        rank: 'ASC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: entries,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async calculateRankings(leaderboardId: string): Promise<LeaderboardEntry[]> {
    const leaderboard = await this.findOne(leaderboardId);

    // Get all entries
    const entries = await this.entryRepository.find({
      where: { leaderboardId },
      relations: ['athlete'],
    });

    // Sort by score (descending) and update ranks
    entries.sort((a, b) => Number(b.score) - Number(a.score));

    const updatedEntries: LeaderboardEntry[] = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      entry.previousRank = entry.rank;
      entry.rank = i + 1;
      updatedEntries.push(entry);
    }

    // Bulk save
    await this.entryRepository.save(updatedEntries);

    return updatedEntries;
  }

  async addOrUpdateEntry(
    leaderboardId: string,
    athleteId: string,
    score: number,
    stats?: {
      matchesPlayed?: number;
      wins?: number;
      losses?: number;
      metadata?: Record<string, any>;
    },
  ): Promise<LeaderboardEntry> {
    // Check if entry exists
    let entry = await this.entryRepository.findOne({
      where: { leaderboardId, athleteId },
    });

    if (entry) {
      // Update existing entry
      entry.score = score;
      if (stats) {
        if (stats.matchesPlayed !== undefined) {
          entry.matchesPlayed += stats.matchesPlayed;
        }
        if (stats.wins !== undefined) {
          entry.wins += stats.wins;
        }
        if (stats.losses !== undefined) {
          entry.losses += stats.losses;
        }
        if (stats.metadata) {
          entry.metadata = { ...entry.metadata, ...stats.metadata };
        }
      }

      // Recalculate win rate
      if (entry.matchesPlayed > 0) {
        entry.winRate = (entry.wins / entry.matchesPlayed) * 100;
      }
    } else {
      // Create new entry
      entry = this.entryRepository.create({
        leaderboardId,
        athleteId,
        score,
        rank: 9999, // Temporary rank, will be recalculated
        matchesPlayed: stats?.matchesPlayed || 0,
        wins: stats?.wins || 0,
        losses: stats?.losses || 0,
        winRate:
          stats?.matchesPlayed && stats.matchesPlayed > 0
            ? ((stats.wins || 0) / stats.matchesPlayed) * 100
            : 0,
        metadata: stats?.metadata || {},
      });
    }

    await this.entryRepository.save(entry);

    // Recalculate all rankings
    await this.calculateRankings(leaderboardId);

    // Return updated entry with new rank
    return await this.entryRepository.findOne({
      where: { leaderboardId, athleteId },
      relations: ['athlete', 'athlete.user'],
    });
  }

  async removeEntry(leaderboardId: string, athleteId: string): Promise<void> {
    const entry = await this.entryRepository.findOne({
      where: { leaderboardId, athleteId },
    });

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    await this.entryRepository.remove(entry);

    // Recalculate rankings
    await this.calculateRankings(leaderboardId);
  }

  async getAthleteRank(
    leaderboardId: string,
    athleteId: string,
  ): Promise<LeaderboardEntry | null> {
    return await this.entryRepository.findOne({
      where: { leaderboardId, athleteId },
      relations: ['athlete', 'athlete.user', 'leaderboard'],
    });
  }

  async getTopAthletes(
    sportType: string,
    limit = 10,
  ): Promise<LeaderboardEntry[]> {
    // Get the most recent active overall leaderboard for this sport
    const leaderboard = await this.leaderboardRepository.findOne({
      where: {
        sportType: sportType as any,
        type: 'OVERALL' as any,
        isActive: true,
      },
      order: {
        created_at: 'DESC',
      },
    });

    if (!leaderboard) {
      return [];
    }

    return await this.entryRepository.find({
      where: { leaderboardId: leaderboard.id },
      relations: ['athlete', 'athlete.user'],
      order: {
        rank: 'ASC',
      },
      take: limit,
    });
  }
}
