import pino from 'pino';
import { Logger, LoggerOptions, LogLevel } from '@eduflow/types';
import { createErrorLogger } from './error';
import { createRequestLogger, createRequestLoggingMiddleware } from './request';

/**
 * Default logger options
 */
const DEFAULT_OPTIONS: Required<Pick<LoggerOptions, 'environment' | 'minLevel'>> = {
  environment: process.env.NODE_ENV || 'development',
  minLevel: 'info' as LogLevel
};

/**
 * Creates a standardized logger instance
 */
export const createLogger = (options: LoggerOptions): Logger => {
  const pinoOptions: pino.LoggerOptions = {
    name: options.service,
    level: options.minLevel || DEFAULT_OPTIONS.minLevel,
    redact: options.redactPaths,
    timestamp: pino.stdTimeFunctions.isoTime,
    base: {
      service: options.service,
      environment: options.environment || DEFAULT_OPTIONS.environment,
    },
    messageKey: 'message',
    errorKey: 'error',
    serializers: {
      error: pino.stdSerializers.err,
      ...options.serializers
    }
  };

  const pinoLogger = pino(pinoOptions);

  // Create our logger instance that implements the Logger interface
  const logger = {
    level: pinoOptions.level as string,
    silent: false,

    trace: (msgOrObj: string | object, ...args: any[]) => pinoLogger.trace(msgOrObj, ...args),
    debug: (msgOrObj: string | object, ...args: any[]) => pinoLogger.debug(msgOrObj, ...args),
    info: (msgOrObj: string | object, ...args: any[]) => pinoLogger.info(msgOrObj, ...args),
    warn: (msgOrObj: string | object, ...args: any[]) => pinoLogger.warn(msgOrObj, ...args),
    error: (msgOrObj: string | object, ...args: any[]) => pinoLogger.error(msgOrObj, ...args),
    fatal: (msgOrObj: string | object, ...args: any[]) => pinoLogger.fatal(msgOrObj, ...args),

    child: (bindings: Record<string, unknown>) => {
      return createLogger({
        ...options,
        ...bindings,
      });
    },
  } as Logger;

  return logger;
};

// Export specialized logger creators
export { createErrorLogger } from './error';
export { createRequestLogger, createRequestLoggingMiddleware } from './request';

// Re-export types
export * from '@eduflow/types'; 