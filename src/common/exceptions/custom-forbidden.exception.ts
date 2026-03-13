import { ErrorCodeEntry } from '../constants/error-codes';
import { CustomException } from './custom.exception';

export class CustomForbiddenException extends CustomException {
  constructor(entry: ErrorCodeEntry, message?: string) {
    super(entry, message);
  }
}
