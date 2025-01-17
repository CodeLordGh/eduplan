export class BaseError extends Error {
  constructor(
    public readonly name: string,
    message: string,
    public readonly cause?: unknown,
    public readonly statusCode: number = 500
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const createError = (
  message: string,
  name: string,
  statusCode: number = 500,
  cause?: unknown
) => new BaseError(name, message, cause, statusCode); 