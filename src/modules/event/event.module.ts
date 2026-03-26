import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProvinceModule } from '../province/province.module';
import { PaymentsModule } from '../payments/payments.module';

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
import { EventOrder } from './entities/event-order.entity';
import { Athlete } from '../athlete/entities/athlete.entity';

import { EventController } from './event.controller';
import { PublicEventController } from './public-event.controller';
import { MatchController } from './match.controller';
import { MatchScoreController } from './match-score.controller';
import { ParticipantController } from './participant.controller';
import { StageController } from './stage.controller';
import { EventOrderController } from './event-order.controller';
import { PublicEventOrderController } from './public-event-order.controller';
import { AdminOrderController } from './admin-order.controller';

import { EventService } from './event.service';
import { MatchService } from './match.service';
import { ParticipantService } from './participant.service';
import { StageService } from './stage.service';
import { EventOrderService } from './event-order.service';
import { StageFactory } from './strategies/stage.factory';
import { RoundRobinPlayoffStrategy } from './strategies/round-robin-playoff.strategy';
import { SingleEliminationStrategy } from './strategies/single-elimination.strategy';
import { DoubleEliminationStrategy } from './strategies/double-elimination.strategy';
import { FlexStrategy } from './strategies/flex.strategy';

@Module({
  imports: [
    ProvinceModule,
    PaymentsModule,
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
      EventOrder,
      Athlete,
    ]),
  ],
  controllers: [
    EventController,
    PublicEventController,
    MatchController,
    MatchScoreController,
    ParticipantController,
    StageController,
    EventOrderController,
    PublicEventOrderController,
    AdminOrderController,
  ],
  providers: [
    EventService,
    MatchService,
    ParticipantService,
    StageService,
    EventOrderService,
    StageFactory,
    RoundRobinPlayoffStrategy,
    SingleEliminationStrategy,
    DoubleEliminationStrategy,
    FlexStrategy,
  ],
  exports: [EventService, MatchService, ParticipantService, StageService, EventOrderService],
})
export class EventModule {}
