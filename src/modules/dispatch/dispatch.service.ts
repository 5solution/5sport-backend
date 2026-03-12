import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { Match, MatchStatus } from '../event/entities/match.entity';
import { Court } from '../court/entities/court.entity';
import { CourtStatus } from '../court/enums/court-status.enum';

export interface AutoAssignPreview {
  assignments: Array<{
    courtId: string;
    courtName: string;
    matchId: string;
    matchName: string;
  }>;
  totalAvailableCourts: number;
  totalPendingMatches: number;
}

@Injectable()
export class DispatchService {
  constructor(
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(Court)
    private readonly courtRepository: Repository<Court>,
  ) {}

  async getMatchQueue(
    eventId: string,
    sessionId?: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<{ data: Match[]; total: number }> {
    const qb = this.matchRepository
      .createQueryBuilder('match')
      .leftJoin('match.session', 'session')
      .leftJoin('session.event', 'event')
      .where('event.id = :eventId', { eventId })
      .andWhere('match.status = :status', { status: MatchStatus.PENDING });

    if (sessionId) {
      qb.andWhere('match.sessionId = :sessionId', { sessionId });
    }

    qb.orderBy('match.priority', 'DESC')
      .addOrderBy('match.created_at', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async assignMatchToCourt(
    matchId: string,
    courtId: string,
  ): Promise<Match> {
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
    });
    if (!match) {
      throw new NotFoundException(`Match ${matchId} not found`);
    }

    if (match.status !== MatchStatus.PENDING) {
      throw new BadRequestException(
        `Match must be in PENDING status to assign. Current: ${match.status}`,
      );
    }

    const court = await this.courtRepository.findOne({
      where: { id: courtId },
    });
    if (!court) {
      throw new NotFoundException(`Court ${courtId} not found`);
    }

    if (court.status === CourtStatus.MAINTENANCE) {
      throw new BadRequestException('Court is under maintenance');
    }

    // Check category compatibility
    if (
      court.allowedSessionIds &&
      court.allowedSessionIds.length > 0 &&
      !court.allowedSessionIds.includes(match.sessionId)
    ) {
      throw new BadRequestException(
        'This court does not allow matches from this category',
      );
    }

    // Check court availability (no active matches)
    const activeMatch = await this.matchRepository.findOne({
      where: {
        courtId,
        status: In([
          MatchStatus.SCHEDULED,
          MatchStatus.WARM_UP,
          MatchStatus.IN_PROGRESS,
        ]),
      },
    });

    if (activeMatch) {
      throw new BadRequestException(
        'Court already has an active or scheduled match',
      );
    }

    match.courtId = courtId;
    match.status = MatchStatus.SCHEDULED;
    return this.matchRepository.save(match);
  }

  async unassignMatch(matchId: string): Promise<Match> {
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
    });
    if (!match) {
      throw new NotFoundException(`Match ${matchId} not found`);
    }

    if (match.status === MatchStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Cannot unassign a match that is in progress',
      );
    }

    if (!match.courtId) {
      throw new BadRequestException('Match is not assigned to any court');
    }

    match.courtId = null;
    match.status = MatchStatus.PENDING;
    return this.matchRepository.save(match);
  }

  async autoAssign(
    eventId: string,
    sessionId?: string,
    confirm: boolean = false,
  ): Promise<AutoAssignPreview | Match[]> {
    // 1. Get available courts
    const allCourts = await this.courtRepository.find({
      where: { eventId, status: CourtStatus.ACTIVE, isGhost: false },
      order: { sortOrder: 'ASC' },
    });

    const availableCourts: Court[] = [];
    for (const court of allCourts) {
      const hasActive = await this.matchRepository.findOne({
        where: {
          courtId: court.id,
          status: In([
            MatchStatus.SCHEDULED,
            MatchStatus.WARM_UP,
            MatchStatus.IN_PROGRESS,
          ]),
        },
      });
      if (!hasActive) {
        availableCourts.push(court);
      }
    }

    // 2. Get pending matches
    const qb = this.matchRepository
      .createQueryBuilder('match')
      .leftJoin('match.session', 'session')
      .leftJoin('session.event', 'event')
      .where('event.id = :eventId', { eventId })
      .andWhere('match.status = :status', { status: MatchStatus.PENDING });

    if (sessionId) {
      qb.andWhere('match.sessionId = :sessionId', { sessionId });
    }

    const pendingMatches = await qb
      .orderBy('match.priority', 'DESC')
      .addOrderBy('match.created_at', 'ASC')
      .getMany();

    // 3. Match courts to matches with category check
    const assignments: Array<{
      courtId: string;
      courtName: string;
      matchId: string;
      matchName: string;
    }> = [];

    const usedCourts = new Set<string>();

    for (const match of pendingMatches) {
      const compatibleCourt = availableCourts.find((court) => {
        if (usedCourts.has(court.id)) return false;
        if (
          court.allowedSessionIds &&
          court.allowedSessionIds.length > 0 &&
          !court.allowedSessionIds.includes(match.sessionId)
        ) {
          return false;
        }
        return true;
      });

      if (compatibleCourt) {
        usedCourts.add(compatibleCourt.id);
        assignments.push({
          courtId: compatibleCourt.id,
          courtName: compatibleCourt.name,
          matchId: match.id,
          matchName: match.name,
        });
      }
    }

    // 4. If not confirming, return preview
    if (!confirm) {
      return {
        assignments,
        totalAvailableCourts: availableCourts.length,
        totalPendingMatches: pendingMatches.length,
      };
    }

    // 5. Execute assignments
    const results: Match[] = [];
    for (const assignment of assignments) {
      const match = await this.matchRepository.findOne({
        where: { id: assignment.matchId },
      });
      if (match) {
        match.courtId = assignment.courtId;
        match.status = MatchStatus.SCHEDULED;
        results.push(await this.matchRepository.save(match));
      }
    }

    return results;
  }

  async swapCourt(matchId: string, newCourtId: string): Promise<Match> {
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
    });
    if (!match) {
      throw new NotFoundException(`Match ${matchId} not found`);
    }

    if (
      match.status !== MatchStatus.SCHEDULED &&
      match.status !== MatchStatus.WARM_UP &&
      match.status !== MatchStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        'Can only swap court for active matches (SCHEDULED, WARM_UP, or IN_PROGRESS)',
      );
    }

    const newCourt = await this.courtRepository.findOne({
      where: { id: newCourtId },
    });
    if (!newCourt) {
      throw new NotFoundException(`Court ${newCourtId} not found`);
    }

    if (newCourt.status === CourtStatus.MAINTENANCE) {
      throw new BadRequestException('Target court is under maintenance');
    }

    // Check new court is available
    const activeOnNewCourt = await this.matchRepository.findOne({
      where: {
        courtId: newCourtId,
        status: In([
          MatchStatus.SCHEDULED,
          MatchStatus.WARM_UP,
          MatchStatus.IN_PROGRESS,
        ]),
      },
    });

    if (activeOnNewCourt) {
      throw new BadRequestException(
        'Target court already has an active match',
      );
    }

    // Swap: keep status, startTime, scores — only change courtId
    match.courtId = newCourtId;
    return this.matchRepository.save(match);
  }
}
