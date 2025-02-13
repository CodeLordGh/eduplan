import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ERROR_CODES } from '@eduflow/constants';
import { errorLogger, createErrorContext } from '../config/logger';

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
  return (
    typeof code === 'string' &&
    Object.values(ERROR_CODES).includes(code as keyof typeof ERROR_CODES)
  );
};

export function errorHandler(error: ExtendedError, request: FastifyRequest, reply: FastifyReply) {
  const requestId = request.id;
  const response: ErrorResponse = {
    error: error.message || 'Internal Server Error',
    code: ERROR_CODES.UNKNOWN_ERROR,
    statusCode: error.statusCode || 500,
    requestId,
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

  const context = createErrorContext(request, error);

  // Log errors using errorLogger
  if (response.statusCode >= 500) {
    errorLogger.logError(error, {
      ...context,
      context: 'request-handler',
      statusCode: response.statusCode,
      code: response.code,
      details: response.details,
    });
  } else {
    errorLogger.logError(error, {
      ...context,
      context: 'request-handler',
      statusCode: response.statusCode,
      code: response.code,
      level: 'info',
    });
  }

  return reply.status(response.statusCode).send(response);
}
