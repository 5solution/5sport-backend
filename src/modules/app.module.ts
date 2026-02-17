import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';
import { env } from 'src/config';
import dataSource from 'src/libs/typeorm.config';

import { AuthModule } from './auth/auth.module';
import { BotModule } from './bot/bot.module';
import { UserModule } from './user/user.module';
import { EventModule } from './event/event.module';
import { ProvinceModule } from './province/province.module';
import { AthleteModule } from './athlete/athlete.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { PaymentsModule } from './payments/payments.module';
import { s3ClientProvider } from './aws.config';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSource.options),
    TypeOrmModule.forFeature([]),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }),
    RedisModule.forRoot({
      type: 'single',
      url: env.redisUrl,
      options: {},
    }),
    ConfigModule,
    UserModule,
    AuthModule,
    BotModule,
    EventModule,
    ProvinceModule,
    AthleteModule,
    LeaderboardModule,
    PaymentsModule,
    UploadModule,
  ],
  providers: [s3ClientProvider],
})
export class AppModule {}
