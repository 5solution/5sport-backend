import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardController } from './leaderboard.controller';
import { Leaderboard, LeaderboardEntry } from './entities';
import { Athlete } from '../athlete/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Leaderboard, LeaderboardEntry, Athlete])],
  controllers: [LeaderboardController],
  providers: [LeaderboardService],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}
