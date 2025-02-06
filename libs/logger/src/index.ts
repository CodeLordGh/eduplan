import pino from 'pino';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { LoggerOptions } from '@eduflow/types';

export const createLogger = (options: LoggerOptions) => pino({
  level: options.minLevel || 'info',
  base: {
    service: options.service,
    environment: options.environment
  }
});

export const createRequestLogger = (logger: pino.Logger) => 
  (request: any, _reply: any, done: () => void) => {
    logger.info('Incoming request', {
      method: request.method,
      url: request.url,
      correlationId: request.correlationId
    });
    done();
  };

export const createErrorLogger = (logger: pino.Logger) => ({
  logError: (error: Error, context: Record<string, unknown>) => {
    logger.error('Error occurred', {
      error: error.message,
      stack: error.stack,
      ...context
    });
    return error;
  },
  logErrorAndReturn: <T>(context: Record<string, unknown>) => 
    (error: Error): TE.TaskEither<Error, T> => 
      pipe(
        TE.left(error),
        TE.chainFirst(() => TE.fromIO(() => {
          logger.error('Error occurred', {
            error: error.message,
            stack: error.stack,
            ...context
          });
        }))
      )
});

export * from '@eduflow/types'; 