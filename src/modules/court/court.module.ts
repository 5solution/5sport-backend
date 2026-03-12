import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { Court } from './entities/court.entity';
import { Match } from '../event/entities/match.entity';

import { CourtService } from './court.service';
import { CourtController } from './court.controller';
import { CourtAccessController } from './court-access.controller';
import { CourtMatchController } from './court-match.controller';
import { CourtJwtStrategy } from './strategies/court-jwt.strategy';
import { EventModule } from '../event/event.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Court, Match]),
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'your-secret-key'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '7d'),
        },
      }),
      inject: [ConfigService],
    }),
    EventModule,
  ],
  controllers: [CourtController, CourtAccessController, CourtMatchController],
  providers: [CourtService, CourtJwtStrategy],
  exports: [CourtService],
})
export class CourtModule {}
