import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ERROR_CODES } from '@eduflow/constants';

interface ErrorResponse {
  error: string;
  code: keyof typeof ERROR_CODES;
  statusCode: number;
  details?: unknown;
  requestId?: string;
}

interface ExtendedError extends FastifyError {
  details?: unknown;
  circuitBreakerError?: boolean;
}

const isValidErrorCode = (code: unknown): code is keyof typeof ERROR_CODES => {
  return typeof code === 'string' && Object.values(ERROR_CODES).includes(code as keyof typeof ERROR_CODES);
};

export function errorHandler(
  error: ExtendedError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const requestId = request.id;
  const response: ErrorResponse = {
    error: error.message || 'Internal Server Error',
    code: ERROR_CODES.UNKNOWN_ERROR,
    statusCode: error.statusCode || 500,
    requestId
  };

  // Handle validation errors
  if (error.validation) {
    response.code = ERROR_CODES.VALIDATION_ERROR;
    response.statusCode = 400;
    response.details = error.validation;
  }
  // Handle authentication errors
  else if (error.code === ERROR_CODES.UNAUTHORIZED || error.statusCode === 401) {
    response.code = ERROR_CODES.UNAUTHORIZED;
    response.statusCode = 401;
  }
  // Handle rate limiting errors
  else if (error.code === ERROR_CODES.RATE_LIMIT_EXCEEDED || error.statusCode === 429) {
    response.code = ERROR_CODES.RATE_LIMIT_EXCEEDED;
    response.statusCode = 429;
  }
  // Handle circuit breaker errors
  else if (error.circuitBreakerError) {
    response.code = ERROR_CODES.SERVICE_UNAVAILABLE;
    response.statusCode = 503;
    response.error = 'Service temporarily unavailable due to circuit breaker';
  }
  // Handle service errors
  else if (error.code === ERROR_CODES.SERVICE_UNAVAILABLE || error.statusCode === 503) {
    response.code = ERROR_CODES.SERVICE_UNAVAILABLE;
    response.statusCode = 503;
  }
  // Handle known error codes from services
  else if (error.code && isValidErrorCode(error.code)) {
    response.code = error.code;
    // Map error codes to appropriate HTTP status codes
    switch (response.code) {
      case ERROR_CODES.VALIDATION_ERROR:
      case ERROR_CODES.INVALID_INPUT:
        response.statusCode = 400;
        break;
      case ERROR_CODES.TOKEN_EXPIRED:
      case ERROR_CODES.INVALID_TOKEN:
        response.statusCode = 401;
        break;
      case ERROR_CODES.UNAUTHORIZED:
        response.statusCode = 403;
        break;
      case ERROR_CODES.RECORD_NOT_FOUND:
      case ERROR_CODES.USER_NOT_FOUND:
        response.statusCode = 404;
        break;
      default:
        response.statusCode = 500;
    }
  }

  // Add error details if available
  if (error.details) {
    response.details = error.details;
  }

  // Log internal server errors
  if (response.statusCode >= 500) {
    request.log.error('Internal Server Error:', {
      error: error.message,
      code: response.code,
      stack: error.stack,
      requestId
    });
  } else {
    // Log other errors at info level with request ID
    request.log.info('Error occurred:', {
      error: error.message,
      code: response.code,
      statusCode: response.statusCode,
      requestId
    });
  }

  return reply.status(response.statusCode).send(response);
} 