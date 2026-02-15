import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventParticipant } from './entities';
import { CreateParticipantDto } from './dto/participant/create-participant.dto';
import { ParticipantStatus } from './entities/event-participant.entity';

@Injectable()
export class ParticipantService {
  constructor(
    @InjectRepository(EventParticipant)
    private readonly participantRepository: Repository<EventParticipant>,
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
