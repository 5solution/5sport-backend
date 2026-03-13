import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';
import { User } from '../user/user.entity';
import { Athlete } from '../athlete/entities/athlete.entity';
import { EventParticipant } from '../event/entities/event-participant.entity';
import { EventSession } from '../event/entities/event-session.entity';
import { Event } from '../event/entities/event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Athlete,
      EventParticipant,
      EventSession,
      Event,
    ]),
  ],
  controllers: [SeedController],
  providers: [SeedService],
})
export class SeedModule {}
