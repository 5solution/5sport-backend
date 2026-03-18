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
import { Stage } from './entities/stage.entity';

import { EventController } from './event.controller';
import { PublicEventController } from './public-event.controller';
import { MatchController } from './match.controller';
import { MatchScoreController } from './match-score.controller';
import { ParticipantController } from './participant.controller';
import { StageController } from './stage.controller';

import { EventService } from './event.service';
import { MatchService } from './match.service';
import { ParticipantService } from './participant.service';
import { StageService } from './stage.service';
import { StageFactory } from './strategies/stage.factory';
import { RoundRobinPlayoffStrategy } from './strategies/round-robin-playoff.strategy';
import { SingleEliminationStrategy } from './strategies/single-elimination.strategy';
import { DoubleEliminationStrategy } from './strategies/double-elimination.strategy';
import { FlexStrategy } from './strategies/flex.strategy';

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
      Stage,
    ]),
  ],
  controllers: [
    EventController,
    PublicEventController,
    MatchController,
    MatchScoreController,
    ParticipantController,
    StageController,
  ],
  providers: [
    EventService,
    MatchService,
    ParticipantService,
    StageService,
    StageFactory,
    RoundRobinPlayoffStrategy,
    SingleEliminationStrategy,
    DoubleEliminationStrategy,
    FlexStrategy,
  ],
  exports: [EventService, MatchService, ParticipantService, StageService],
})
export class EventModule {}
