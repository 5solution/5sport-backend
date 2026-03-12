import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Match } from '../event/entities/match.entity';
import { Court } from '../court/entities/court.entity';

import { DispatchService } from './dispatch.service';
import { DispatchController } from './dispatch.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Match, Court])],
  controllers: [DispatchController],
  providers: [DispatchService],
  exports: [DispatchService],
})
export class DispatchModule {}
