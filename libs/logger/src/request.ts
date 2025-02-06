import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import { FastifyRequest, FastifyReply } from 'fastify';
import { Logger, LogContext } from '@eduflow/types';

/**
 * Extract relevant request information for logging
 */
const extractRequestInfo = (request: FastifyRequest): Partial<LogContext> => ({
  correlationId: request.id,
  method: request.method,
  url: request.url,
  ip: request.ip,
  userAgent: request.headers['user-agent'],
  requestId: request.id
});

/**
 * Extract relevant response information for logging
 */
const extractResponseInfo = (reply: FastifyReply): Partial<LogContext> => ({
  statusCode: reply.statusCode,
  responseTime: reply.elapsedTime
});

/**
 * Create request logger middleware
 */
export const createRequestLogger = (logger: Logger) => {
  const requestLogger = logger.child({ component: 'http' });

  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const requestInfo = extractRequestInfo(request);
    
    // Log request
    await pipe(
      TE.tryCatch(
        () => Promise.resolve(
          requestLogger.info('Incoming request', requestInfo)
        ),
        (error) => new Error(`Failed to log request: ${error}`)
      )
    )();

    // Log response using onSend hook
    reply.raw.on('finish', async () => {
      const responseInfo = {
        ...requestInfo,
        ...extractResponseInfo(reply)
      };

      await pipe(
        TE.tryCatch(
          () => Promise.resolve(
            requestLogger.info('Request completed', responseInfo)
          ),
          (error) => new Error(`Failed to log response: ${error}`)
        )
      )();
    });
  };
}; 