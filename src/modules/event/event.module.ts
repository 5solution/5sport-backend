import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProvinceModule } from '../province/province.module';

import { Event } from './entities/event.entity';
import { EventMedia } from './entities/event-media.entity';
import { EventDescription } from './entities/event-description.entity';
import { EventSession } from './entities/event-session.entity';
import { TicketTier } from './entities/ticket-tier.entity';
import { EventCustomField } from './entities/event-custom-field.entity';
import { EventBlacklist } from './entities/event-blacklist.entity';
import { Match } from './entities/match.entity';
import { MatchScore } from './entities/match-score.entity';
import { EventParticipant } from './entities/event-participant.entity';

import { EventController } from './event.controller';
import { MatchController } from './match.controller';
import { ParticipantController } from './participant.controller';

import { EventService } from './event.service';
import { MatchService } from './match.service';
import { ParticipantService } from './participant.service';

@Module({
  imports: [
    ProvinceModule,
    TypeOrmModule.forFeature([
      Event,
      EventMedia,
      EventDescription,
      EventSession,
      TicketTier,
      EventCustomField,
      EventBlacklist,
      Match,
      MatchScore,
      EventParticipant,
    ]),
  ],
  controllers: [EventController, MatchController, ParticipantController],
  providers: [EventService, MatchService, ParticipantService],
  exports: [EventService, MatchService, ParticipantService],
})
export class EventModule {}
