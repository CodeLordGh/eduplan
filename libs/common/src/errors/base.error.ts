import { AppError, ErrorCode, ErrorDetails, ErrorResponse } from '@eduflow/types';

const HTTP_STATUS_CODES: Record<ErrorCode, number> = {
  AUTH_ERROR: 401,
  UNAUTHORIZED: 403,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  INTERNAL_SERVER_ERROR: 500,
  BAD_REQUEST: 400,
  CONFLICT: 409,
  SERVICE_UNAVAILABLE: 503,
  FILE_SIZE_ERROR: 413,
  FILE_TYPE_ERROR: 415,
  FILE_QUOTA_ERROR: 507,
  FILE_ACCESS_ERROR: 403,
  FILE_NOT_FOUND: 404,
} as const;

export const createAppError = (details: ErrorDetails): AppError => {
  const statusCode = HTTP_STATUS_CODES[details.code];

  return {
    name: details.code,
    message: details.message,
    statusCode,
    code: details.code,
    cause: details.cause,
    metadata: details.metadata,
  };
};

export const throwError = (details: ErrorDetails): never => {
  throw createAppError(details);
};

export const createErrorResponse = (error: AppError): ErrorResponse => ({
  error,
});
