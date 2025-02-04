import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { AppError } from '@eduflow/types';
import { Logger, LogContext } from './types';

/**
 * Extract error details for logging
 */
const extractErrorDetails = (error: AppError): Partial<LogContext> => ({
  errorCode: error.code,
  errorMessage: error.message,
  errorStack: (error as Error)?.stack,
  errorMetadata: error.metadata
});

/**
 * Create error logger utility
 */
export const createErrorLogger = (logger: Logger) => {
  const errorLogger = logger.child({ component: 'error' });

  return {
    /**
     * Log an error with full context
     */
    logError: (error: AppError, context?: Partial<LogContext>): TE.TaskEither<Error, void> =>
      pipe(
        TE.tryCatch(
          () => Promise.resolve(
            errorLogger.error(
              error.message,
              {
                ...extractErrorDetails(error),
                ...context
              }
            )
          ),
          (err) => new Error(`Failed to log error: ${err}`)
        )
      ),

    /**
     * Log an error and return it (useful in fp-ts pipes)
     */
    logErrorAndReturn: <E extends AppError>(context?: Partial<LogContext>) =>
      (error: E): TE.TaskEither<E, never> =>
        pipe(
          TE.tryCatch(
            () => Promise.resolve(
              errorLogger.error(
                error.message,
                {
                  ...extractErrorDetails(error),
                  ...context
                }
              )
            ),
            () => error
          ),
          TE.chain(() => TE.left(error))
        )
  };
}; 