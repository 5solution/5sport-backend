import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AthleteService } from './athlete.service';
import { AthleteController } from './athlete.controller';
import { Athlete, AthleteStats } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([Athlete, AthleteStats])],
  controllers: [AthleteController],
  providers: [AthleteService],
  exports: [AthleteService],
})
export class AthleteModule {}
