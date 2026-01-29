import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';
import { env } from 'src/config';
import dataSource from 'src/libs/typeorm.config';

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
  ],
})
export class AppModule {}
