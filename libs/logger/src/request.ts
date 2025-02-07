import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import { Logger, RequestContext } from '@eduflow/types';

type ExtendedLogger = Logger & {
  request: (context: Partial<RequestContext>) => void;
  response: (context: Partial<RequestContext> & { statusCode: number; duration: number }) => void;
};

/**
 * Extract relevant request information for logging
 */
const extractRequestInfo = (request: FastifyRequest): Partial<RequestContext> => ({
  correlationId: request.id,
  method: request.method,
  path: request.url,
  ip: request.ip,
  userAgent: request.headers['user-agent'],
  sessionId: request.id
});

/**
 * Extract relevant response information for logging
 */
const extractResponseInfo = (reply: FastifyReply): { statusCode: number; duration: number } => ({
  statusCode: reply.statusCode,
  duration: reply.elapsedTime || 0
});

/**
 * Creates a request logger with specialized request logging methods
 */
export const createRequestLogger = (logger: Logger): ExtendedLogger => {
  const requestLogger = logger.child({ component: 'request' }) as ExtendedLogger;

  requestLogger.request = (context: Partial<RequestContext>) => {
    requestLogger.info('Incoming request', {
      ...context,
      type: 'request',
      timestamp: new Date().toISOString()
    });
  };

  requestLogger.response = (context: Partial<RequestContext> & { statusCode: number; duration: number }) => {
    const level = context.statusCode >= 500 ? 'error' : 
                 context.statusCode >= 400 ? 'warn' : 
                 'info';

    requestLogger[level]('Request completed', {
      ...context,
      type: 'response',
      timestamp: new Date().toISOString()
    });
  };

  return requestLogger;
};

/**
 * Creates a Fastify middleware for request logging
 */
export const createRequestLoggingMiddleware = (logger: Logger) => {
  const requestLogger = createRequestLogger(logger);

  return (request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => {
    const requestInfo = extractRequestInfo(request);
    const startTime = process.hrtime();

    requestLogger.request(requestInfo);

    reply.raw.on('finish', () => {
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const duration = seconds * 1000 + nanoseconds / 1000000;

      const responseInfo = {
        statusCode: reply.statusCode,
        duration
      };

      requestLogger.response({
        ...requestInfo,
        ...responseInfo
      });
    });

    done();
  };
}; 