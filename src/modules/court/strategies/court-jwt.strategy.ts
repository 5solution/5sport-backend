import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class CourtJwtStrategy extends PassportStrategy(Strategy, 'court-jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'your-secret-key'),
    });
  }

  async validate(payload: any) {
    if (payload.type !== 'court-access') {
      throw new UnauthorizedException('Invalid token type for court access');
    }

    return {
      courtId: payload.sub,
      eventId: payload.eventId,
      type: payload.type,
    };
  }
}
