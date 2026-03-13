import { ErrorCodeEntry } from '../constants/error-codes';
import { CustomException } from './custom.exception';

export class CustomBadRequestException extends CustomException {
  constructor(entry: ErrorCodeEntry, message?: string) {
    super(entry, message);
  }
}
