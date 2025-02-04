import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as R from 'fp-ts/Record';
import pino from 'pino';
import { 
  LOG_LEVELS,
  LogLevel, 
  LoggerOptions, 
  Logger,
  LogContext,
  LogFn
} from './types';

/**
 * Default logger options
 */
const DEFAULT_OPTIONS: Partial<LoggerOptions> = {
  environment: process.env.NODE_ENV || 'development',
  minLevel: LOG_LEVELS.INFO,
  redactPaths: [
    'req.headers.authorization',
    '*.password',
    '*.token',
    '*.secret',
    '*.key'
  ]
};

/**
 * Create a pino logger instance with the given options
 */
const createPinoLogger = (options: LoggerOptions): pino.Logger => {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options };
  
  return pino({
    name: finalOptions.service,
    level: finalOptions.minLevel,
    redact: finalOptions.redactPaths,
    serializers: {
      err: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    base: {
      service: finalOptions.service,
      environment: finalOptions.environment
    }
  });
};

/**
 * Create a log function for a specific level
 */
const createLogFunction = (
  pinoLogger: pino.Logger,
  baseContext: Partial<LogContext>,
  level: LogLevel
): LogFn => (message: string, context: Partial<LogContext> = {}) => {
  const timestamp = new Date().toISOString();
  const finalContext = {
    ...baseContext,
    ...context,
    timestamp
  };

  pinoLogger[level]({
    msg: message,
    ...finalContext
  });
};

/**
 * Create a logger instance with the given options
 */
export const createLogger = (options: LoggerOptions): Logger => {
  const pinoLogger = createPinoLogger(options);
  const baseContext = {
    service: options.service,
    environment: options.environment || DEFAULT_OPTIONS.environment
  };

  // Create log functions for each level
  const logFunctions = Object.fromEntries(
    Object.entries(LOG_LEVELS).map(([key, level]) => [
      key.toLowerCase(),
      createLogFunction(pinoLogger, baseContext, level)
    ])
  );

  // Create child logger function
  const child = (childContext: Partial<LogContext>): Logger =>
    createLogger({
      ...options,
      ...pipe(
        O.fromNullable(pinoLogger.child(childContext)),
        O.map((childPino) => ({ pinoLogger: childPino })),
        O.getOrElse(() => ({}))
      )
    });

  return {
    ...logFunctions,
    child
  } as Logger;
}; 