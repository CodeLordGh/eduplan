import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as R from 'fp-ts/Record';
import pino, { Logger as PinoLogger, LoggerOptions as PinoOptions } from 'pino';
import { 
  LOG_LEVELS,
  LogLevel, 
  LoggerOptions, 
  Logger,
  LogContext,
  LogFn
} from '@eduflow/types';

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
const createPinoLogger = (options: LoggerOptions): PinoLogger => {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options };
  
  const pinoInstance = pino as any;
  
  return pino({
    name: finalOptions.service,
    level: finalOptions.minLevel,
    redact: finalOptions.redactPaths,
    serializers: pinoInstance.stdSerializers,
    timestamp: pinoInstance.stdTimeFunctions.isoTime,
    base: {
      service: finalOptions.service,
      environment: finalOptions.environment
    }
  } as PinoOptions);
};

/**
 * Create a log function for a specific level
 */
const createLogFunction = (
  pinoLogger: PinoLogger,
  baseContext: Partial<LogContext>,
  level: LogLevel
): LogFn => {
  const logFn = (msgOrObj: string | object, ...args: any[]): void => {
    const timestamp = new Date().toISOString();
    
    if (typeof msgOrObj === 'string') {
      const [context = {}] = args;
      const finalContext = {
        ...baseContext,
        ...context,
        timestamp
      };
      
      pinoLogger[level]({
        msg: msgOrObj,
        ...finalContext
      });
    } else {
      const [msg, ...restArgs] = args;
      const finalContext = {
        ...baseContext,
        ...msgOrObj,
        timestamp
      };
      
      pinoLogger[level]({
        msg: msg || '',
        ...finalContext
      });
    }
  };
  
  return logFn;
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
        O.fromNullable((pinoLogger as any).child(childContext)),
        O.map((childPino) => ({ pinoLogger: childPino })),
        O.getOrElse(() => ({}))
      )
    });

  return {
    ...logFunctions,
    child
  } as Logger;
}; 