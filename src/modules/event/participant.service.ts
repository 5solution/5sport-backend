import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventParticipant } from './entities';
import { CreateParticipantDto } from './dto/participant/create-participant.dto';
import { ParticipantStatus } from './entities/event-participant.entity';
import { Stage } from './entities/stage.entity';
import { EventSession } from './entities/event-session.entity';
import { CompetitionFormat } from './enums/competition-format.enum';

@Injectable()
export class ParticipantService {
  constructor(
    @InjectRepository(EventParticipant)
    private readonly participantRepository: Repository<EventParticipant>,
    @InjectRepository(Stage)
    private readonly stageRepository: Repository<Stage>,
    @InjectRepository(EventSession)
    private readonly sessionRepository: Repository<EventSession>,
  ) {}

  async create(createDto: CreateParticipantDto, userId: string): Promise<EventParticipant> {
    // Check if already registered
    const existing = await this.participantRepository.findOne({
      where: {
        eventId: createDto.eventId,
        athleteId: createDto.athleteId,
      },
    });

    if (existing) {
      throw new ConflictException('Already registered for this event');
    }

    // Generate ticket code
    const ticketCode = await this.generateTicketCode(createDto.eventId);

    const participant = this.participantRepository.create({
      ...createDto,
      userId,
      ticketCode,
      registrationDate: new Date(),
      status: ParticipantStatus.REGISTERED,
    });

    return await this.participantRepository.save(participant);
  }

  async findAllByEvent(eventId: string): Promise<EventParticipant[]> {
    return await this.participantRepository.find({
      where: { eventId },
      relations: ['athlete', 'partner', 'session', 'user'],
      order: { registrationDate: 'ASC' },
    });
  }

  async findOne(id: string): Promise<EventParticipant> {
    const participant = await this.participantRepository.findOne({
      where: { id },
      relations: ['athlete', 'partner', 'session', 'event', 'user'],
    });

    if (!participant) {
      throw new NotFoundException(`Participant with ID ${id} not found`);
    }

    return participant;
  }

  async checkin(id: string): Promise<EventParticipant> {
    const participant = await this.findOne(id);
    
    participant.status = ParticipantStatus.CHECKED_IN;
    participant.checkinDate = new Date();
    
    return await this.participantRepository.save(participant);
  }

  async withdraw(id: string, userId: string): Promise<EventParticipant> {
    const participant = await this.findOne(id);

    if (participant.userId !== userId) {
      throw new ConflictException('You can only withdraw your own registration');
    }

    participant.status = ParticipantStatus.WITHDRAWN;
    
    return await this.participantRepository.save(participant);
  }

  async remove(id: string): Promise<void> {
    const participant = await this.findOne(id);
    await this.participantRepository.remove(participant);
  }

  async findByAthlete(athleteId: string): Promise<EventParticipant[]> {
    return await this.participantRepository.find({
      where: { athleteId },
      relations: ['event', 'session'],
      order: { registrationDate: 'DESC' },
    });
  }

  private async generateTicketCode(eventId: string): Promise<string> {
    const count = await this.participantRepository.count({
      where: { eventId },
    });

    const paddedNumber = String(count + 1).padStart(4, '0');
    return `TKT-${paddedNumber}`;
  }

  async assignBibNumber(id: string, bibNumber: string): Promise<EventParticipant> {
    const participant = await this.findOne(id);
    participant.bibNumber = bibNumber;
    return await this.participantRepository.save(participant);
  }

  async updateCustomData(
    id: string,
    customData: Record<string, any>,
  ): Promise<EventParticipant> {
    const participant = await this.findOne(id);
    participant.customData = { ...participant.customData, ...customData };
    return await this.participantRepository.save(participant);
  }

  async findAllByStage(stageId: string): Promise<EventParticipant[]> {
    const stage = await this.stageRepository.findOne({ where: { id: stageId } });
    if (!stage) {
      throw new NotFoundException(`Stage with ID ${stageId} not found`);
    }
    return this.participantRepository.find({
      where: { sessionId: stage.sessionId },
      relations: ['athlete', 'partner', 'user'],
      order: { seed: 'ASC', registrationDate: 'ASC' },
    });
  }

  async assignPartner(
    id: string,
    partnerParticipantId: string,
  ): Promise<EventParticipant> {
    if (id === partnerParticipantId) {
      throw new BadRequestException('Cannot pair a participant with themselves');
    }

    const [participant, partnerParticipant] = await Promise.all([
      this.findOne(id),
      this.findOne(partnerParticipantId),
    ]);

    const session = await this.sessionRepository.findOne({
      where: { id: participant.sessionId },
    });
    if (!session || session.competitionFormat !== CompetitionFormat.DOUBLES) {
      throw new BadRequestException('Partner assignment is only allowed for DOUBLES sessions');
    }

    if (participant.sessionId !== partnerParticipant.sessionId) {
      throw new BadRequestException('Both participants must belong to the same session');
    }

    if (participant.partnerId) {
      throw new ConflictException('Participant already has a partner assigned');
    }
    if (partnerParticipant.partnerId) {
      throw new ConflictException('Partner participant already has a partner assigned');
    }

    participant.partnerId = partnerParticipant.athleteId;
    participant.status = ParticipantStatus.PAIRED;
    partnerParticipant.partnerId = participant.athleteId;
    partnerParticipant.status = ParticipantStatus.PAIRED;

    await this.participantRepository.save([participant, partnerParticipant]);
    return this.findOne(id);
  }

  async removePartner(id: string): Promise<EventParticipant> {
    const participant = await this.findOne(id);

    if (!participant.partnerId) {
      throw new BadRequestException('Participant has no partner to remove');
    }

    const partnerParticipant = await this.participantRepository.findOne({
      where: { sessionId: participant.sessionId, athleteId: participant.partnerId },
    });

    participant.partnerId = null;
    participant.status = ParticipantStatus.FINDING_PARTNER;

    if (partnerParticipant) {
      partnerParticipant.partnerId = null;
      partnerParticipant.status = ParticipantStatus.FINDING_PARTNER;
      await this.participantRepository.save([participant, partnerParticipant]);
    } else {
      await this.participantRepository.save(participant);
    }

    return this.findOne(id);
  }

  async getParticipantsBySession(sessionId: string): Promise<EventParticipant[]> {
    return await this.participantRepository.find({
      where: { sessionId },
      relations: ['athlete', 'partner', 'user'],
      order: { registrationDate: 'ASC' },
    });
  }

  async getCheckedInParticipants(eventId: string): Promise<EventParticipant[]> {
    return await this.participantRepository.find({
      where: {
        eventId,
        status: ParticipantStatus.CHECKED_IN,
      },
      relations: ['athlete', 'partner', 'session'],
    });
  }
}
