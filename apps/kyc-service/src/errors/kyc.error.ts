import { BaseError } from '@eduflow/common';

export class KYCError extends BaseError {
  constructor(message: string, cause?: unknown) {
    super('KYCError', message, cause);
  }
} 