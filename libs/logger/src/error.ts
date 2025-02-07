import { Logger, ErrorContext } from '@eduflow/types';
import { AppError } from '@eduflow/types';

type ExtendedLogger = Logger & {
  logError: (error: AppError, context?: Partial<ErrorContext>) => void;
  logErrorAndReturn: <E extends AppError>(error: E, context?: Partial<ErrorContext>) => E;
};

/**
 * Extract error details for logging
 */
const extractErrorDetails = (error: AppError): Partial<ErrorContext> => ({
  message: error.message,
  stack: (error as Error).stack,
  code: error.code,
  statusCode: error.statusCode,
  timestamp: new Date().toISOString()
});

/**
 * Creates an error logger with specialized error logging methods
 */
export const createErrorLogger = (logger: Logger): ExtendedLogger => {
  const errorLogger = logger.child({ component: 'error' }) as ExtendedLogger;

  errorLogger.logError = (error: AppError, context: Partial<ErrorContext> = {}) => {
    errorLogger.error('Error occurred', {
      ...extractErrorDetails(error),
      ...context,
      type: 'error'
    });
  };

  errorLogger.logErrorAndReturn = <E extends AppError>(error: E, context: Partial<ErrorContext> = {}) => {
    errorLogger.logError(error, context);
    return error;
  };

  return errorLogger;
}; 