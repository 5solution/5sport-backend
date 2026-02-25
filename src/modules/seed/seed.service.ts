import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../user/user.entity';
import { Athlete } from '../athlete/entities/athlete.entity';
import { EventParticipant } from '../event/entities/event-participant.entity';
import { EventSession } from '../event/entities/event-session.entity';
import { Event } from '../event/entities/event.entity';
import { Role } from 'src/common/enums/role.enum';
import { SportType } from '../event/enums/sport-type.enum';
import { ParticipantStatus } from '../event/entities/event-participant.entity';
import { GenerateUsersDto } from './dto/generate-users.dto';
import { RegisterParticipantsDto } from './dto/register-participants.dto';

const FIRST_NAMES = [
  'Minh', 'Hùng', 'Thắng', 'Dũng', 'Tuấn', 'Phong', 'Hải', 'Long',
  'Quang', 'Đức', 'Nam', 'Bình', 'Khoa', 'Tùng', 'Vinh', 'Trung',
  'Linh', 'Hà', 'Mai', 'Lan', 'Ngọc', 'Thảo', 'Trang', 'Hương',
  'Anh', 'Vy', 'Thy', 'Phương', 'Châu', 'Nhi', 'Khánh', 'Bảo',
];

const LAST_NAMES = [
  'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ',
  'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý',
];

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Athlete)
    private readonly athleteRepo: Repository<Athlete>,
    @InjectRepository(EventParticipant)
    private readonly participantRepo: Repository<EventParticipant>,
    @InjectRepository(EventSession)
    private readonly sessionRepo: Repository<EventSession>,
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
  ) {}

  async generateUsers(dto: GenerateUsersDto): Promise<User[]> {
    const { count, prefix = 'Bot' } = dto;
    const hashedPassword = await bcrypt.hash('bot123456', 10);
    const timestamp = Date.now();
    const users: User[] = [];

    for (let i = 0; i < count; i++) {
      const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      const displayName = `${prefix} ${lastName} ${firstName}`;
      const email = `bot_${timestamp}_${i}@5sport.bot`;

      const user = this.userRepo.create({
        email,
        password: hashedPassword,
        role: Role.USER,
        displayName,
        tags: ['bot', 'seed'],
      });

      users.push(await this.userRepo.save(user));
    }

    return users;
  }

  async registerParticipants(
    dto: RegisterParticipantsDto,
  ): Promise<EventParticipant[]> {
    const { eventId, sessionId, count } = dto;

    // Validate event and session exist
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException(`Event ${eventId} not found`);

    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, eventId },
    });
    if (!session) throw new NotFoundException(`Session ${sessionId} not found`);

    // Get bot users that are NOT yet registered for this event
    const existingParticipants = await this.participantRepo.find({
      where: { eventId },
      select: ['userId'],
    });
    const registeredUserIds = new Set(existingParticipants.map((p) => p.userId));

    const botUsers = await this.userRepo
      .createQueryBuilder('user')
      .where("user.tags LIKE '%bot%'")
      .getMany();

    const availableUsers = botUsers.filter((u) => !registeredUserIds.has(u.id));

    if (availableUsers.length < count) {
      // Auto-generate more bot users if needed
      const needed = count - availableUsers.length;
      const newUsers = await this.generateUsers({
        count: needed,
        prefix: 'Bot',
      });
      availableUsers.push(...newUsers);
    }

    const selectedUsers = availableUsers.slice(0, count);
    const participants: EventParticipant[] = [];
    const existingCount = await this.participantRepo.count({ where: { eventId } });

    for (let i = 0; i < selectedUsers.length; i++) {
      const user = selectedUsers[i];

      // Ensure athlete exists for this user + sport type
      let athlete = await this.athleteRepo.findOne({
        where: { userId: user.id, sportType: event.sportType },
      });

      if (!athlete) {
        athlete = this.athleteRepo.create({
          userId: user.id,
          name: user.displayName || user.email,
          sportType: event.sportType,
          currentRating: +(Math.random() * 3 + 2).toFixed(2), // 2.00 - 5.00
        });
        athlete = await this.athleteRepo.save(athlete);
      }

      const ticketCode = `TKT-${String(existingCount + i + 1).padStart(4, '0')}`;

      const participant = this.participantRepo.create({
        eventId,
        sessionId,
        athleteId: athlete.id,
        userId: user.id,
        ticketCode,
        registrationDate: new Date(),
        status: ParticipantStatus.REGISTERED,
      });

      participants.push(await this.participantRepo.save(participant));
    }

    return participants;
  }
}
