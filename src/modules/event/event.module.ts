import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Event } from './entities/event.entity';
import { EventMedia } from './entities/event-media.entity';
import { EventDescription } from './entities/event-description.entity';
import { EventSession } from './entities/event-session.entity';
import { TicketTier } from './entities/ticket-tier.entity';
import { EventCustomField } from './entities/event-custom-field.entity';
import { EventBlacklist } from './entities/event-blacklist.entity';
import { EventController } from './event.controller';
import { EventService } from './event.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Event,
      EventMedia,
      EventDescription,
      EventSession,
      TicketTier,
      EventCustomField,
      EventBlacklist,
    ]),
  ],
  controllers: [EventController],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
