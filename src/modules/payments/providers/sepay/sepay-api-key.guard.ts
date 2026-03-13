import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import * as crypto from 'crypto';
import { env } from 'src/config';

@Injectable()
export class SepayApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const providedKey = request.headers['x-secret-key'];

    if (!providedKey || typeof providedKey !== 'string') {
      throw new UnauthorizedException('Missing or invalid SePay API key');
    }

    const expectedKey = env.sepay.webhookApiKey;

    if (!expectedKey) {
      throw new UnauthorizedException('SePay webhook API key not configured');
    }

    const providedBuf = Buffer.from(providedKey, 'utf8');
    const expectedBuf = Buffer.from(expectedKey, 'utf8');

    if (
      providedBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(providedBuf, expectedBuf)
    ) {
      throw new UnauthorizedException('Invalid SePay API key');
    }

    return true;
  }
}
