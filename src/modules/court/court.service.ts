import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

import { Court } from './entities/court.entity';
import { CourtStatus, CourtOperationalStatus } from './enums/court-status.enum';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';
import { Match } from '../event/entities/match.entity';
import { MatchStatus } from '../event/entities/match.entity';

export interface CourtGridItem {
  court: Court;
  operationalStatus: CourtOperationalStatus;
  currentMatch: Match | null;
}

@Injectable()
export class CourtService {
  constructor(
    @InjectRepository(Court)
    private readonly courtRepository: Repository<Court>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    private readonly jwtService: JwtService,
  ) {}

  private generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async bulkCreate(eventId: string, count: number): Promise<Court[]> {
    const existingCourts = await this.courtRepository.count({
      where: { eventId },
    });

    const courts: Court[] = [];
    for (let i = 1; i <= count; i++) {
      const court = this.courtRepository.create({
        eventId,
        name: `San ${existingCourts + i}`,
        sortOrder: existingCourts + i,
        accessSecret: this.generateSecret(),
      });
      courts.push(court);
    }

    return await this.courtRepository.save(courts);
  }

  async addOne(eventId: string, dto: CreateCourtDto): Promise<Court> {
    const maxSort = await this.courtRepository
      .createQueryBuilder('court')
      .select('MAX(court.sortOrder)', 'max')
      .where('court.event_id = :eventId', { eventId })
      .getRawOne();

    const court = this.courtRepository.create({
      eventId,
      name: dto.name,
      sortOrder: (maxSort?.max || 0) + 1,
      accessSecret: this.generateSecret(),
      isGhost: dto.isGhost || false,
      allowedSessionIds: dto.allowedSessionIds || null,
    });

    return await this.courtRepository.save(court);
  }

  async findAllByEvent(eventId: string): Promise<Court[]> {
    return await this.courtRepository.find({
      where: { eventId },
      order: { sortOrder: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Court> {
    const court = await this.courtRepository.findOne({ where: { id } });
    if (!court) {
      throw new NotFoundException(`Court with ID ${id} not found`);
    }
    return court;
  }

  async update(id: string, dto: UpdateCourtDto): Promise<Court> {
    const court = await this.findOne(id);
    Object.assign(court, dto);
    return await this.courtRepository.save(court);
  }

  async remove(id: string): Promise<void> {
    const court = await this.findOne(id);

    // Check for active matches on this court
    const activeMatch = await this.matchRepository.findOne({
      where: {
        courtId: id,
        status: In([
          MatchStatus.SCHEDULED,
          MatchStatus.WARM_UP,
          MatchStatus.IN_PROGRESS,
        ]),
      },
    });

    if (activeMatch) {
      throw new BadRequestException(
        'Cannot delete court with active or scheduled matches. Unassign matches first.',
      );
    }

    await this.courtRepository.remove(court);
  }

  async getCourtGrid(eventId: string): Promise<CourtGridItem[]> {
    const courts = await this.findAllByEvent(eventId);

    const result: CourtGridItem[] = [];

    for (const court of courts) {
      // Find active match on this court (non-completed, non-cancelled)
      const activeMatch = await this.matchRepository.findOne({
        where: {
          courtId: court.id,
          status: In([
            MatchStatus.SCHEDULED,
            MatchStatus.WARM_UP,
            MatchStatus.IN_PROGRESS,
          ]),
        },
        order: { scheduledTime: 'ASC' },
      });

      let operationalStatus: CourtOperationalStatus;

      if (court.status === CourtStatus.MAINTENANCE) {
        operationalStatus = CourtOperationalStatus.MAINTENANCE;
      } else if (
        activeMatch &&
        (activeMatch.status === MatchStatus.IN_PROGRESS ||
          activeMatch.status === MatchStatus.WARM_UP)
      ) {
        operationalStatus = CourtOperationalStatus.BUSY;
      } else if (
        activeMatch &&
        activeMatch.status === MatchStatus.SCHEDULED
      ) {
        operationalStatus = CourtOperationalStatus.RESERVED;
      } else {
        operationalStatus = CourtOperationalStatus.AVAILABLE;
      }

      result.push({
        court,
        operationalStatus,
        currentMatch: activeMatch || null,
      });
    }

    return result;
  }

  // --- QR Auth methods ---

  async getQrPayload(
    courtId: string,
  ): Promise<{ token: string; url: string }> {
    const court = await this.findOne(courtId);

    const payload = {
      eventId: court.eventId,
      courtId: court.id,
      secret: court.accessSecret,
      type: 'court-qr',
    };

    const token = this.jwtService.sign(payload, { expiresIn: '365d' });
    const url = `https://match.5sport.vn/auth/qr?t=${token}`;

    return { token, url };
  }

  async rotateSecret(courtId: string): Promise<{ token: string; url: string }> {
    const court = await this.findOne(courtId);
    court.accessSecret = this.generateSecret();
    await this.courtRepository.save(court);

    return this.getQrPayload(courtId);
  }

  async validateQrToken(
    token: string,
  ): Promise<{ courtId: string; eventId: string }> {
    let decoded: any;
    try {
      decoded = this.jwtService.verify(token);
    } catch {
      throw new BadRequestException('Invalid or expired QR token');
    }

    if (decoded.type !== 'court-qr') {
      throw new BadRequestException('Invalid token type');
    }

    const court = await this.findOne(decoded.courtId);

    if (court.accessSecret !== decoded.secret) {
      throw new BadRequestException(
        'QR code has been revoked. Please scan the new QR code.',
      );
    }

    return { courtId: court.id, eventId: court.eventId };
  }

  async issueCourtAccessToken(
    courtId: string,
    eventId: string,
  ): Promise<string> {
    const payload = {
      sub: courtId,
      eventId,
      type: 'court-access',
    };

    return this.jwtService.sign(payload, { expiresIn: '8h' });
  }
}
