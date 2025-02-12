import { BaseError } from '@eduflow/common';

export class AuthError extends BaseError {
  constructor(message: string, cause?: unknown) {
    super('AuthError', message, cause);
  }
}
