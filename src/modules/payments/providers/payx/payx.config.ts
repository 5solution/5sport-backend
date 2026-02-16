import { Injectable } from '@nestjs/common';
import { env } from 'src/config';

@Injectable()
export class PayxConfig {
  get merchantCode(): string {
    return env.payx.merchantCode;
  }

  get secretKey(): string {
    return env.payx.secretKey;
  }

  get apiUrl(): string {
    return env.payx.apiUrl;
  }
}
