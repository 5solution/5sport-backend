import { HttpException } from '@nestjs/common';
import { ErrorCodeEntry } from '../constants/error-codes';

export class CustomException extends HttpException {
  readonly errorCode: string;

  constructor(entry: ErrorCodeEntry, message?: string) {
    super(
      { code: entry.code, message: message ?? 'An error occurred' },
      entry.http,
    );
    this.errorCode = entry.code;
  }
}
