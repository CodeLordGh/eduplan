import pino from 'pino';
import type { Logger as PinoLogger } from 'pino';
import type { Logger, LogContext, LogFn } from '@eduflow/types';

export type LogLevel = 'info' | 'error' | 'warn' | 'debug' | 'trace' | 'fatal';

export interface LoggerOptions {
  service: string;
  environment?: string;
  minLevel?: string;
  metadata?: Record<string, unknown>;
}

const createBaseLogger = (service: string, options = {}) =>
  pino({
    ...options,
    level: process.env.LOG_LEVEL || 'info',
  });

const formatError = (error?: Error): Record<string, unknown> | undefined =>
  error
    ? {
        message: error.message,
        stack: error.stack,
      }
    : undefined;

const createLogFn = (baseLogger: PinoLogger, level: LogLevel): LogFn => {
  const fn: LogFn = function(msgOrObj: string | object, ...args: any[]): void {
    if (typeof msgOrObj === 'string') {
      const [context = {}] = args;
      baseLogger[level](context, msgOrObj);
    } else {
      const [msg = ''] = args;
      baseLogger[level](msgOrObj, msg);
    }
  };
  return fn;
};

const createErrorLogFn = (baseLogger: PinoLogger): LogFn => {
  const fn: LogFn = function(msgOrObj: string | object, ...args: any[]): void {
    if (typeof msgOrObj === 'string') {
      const [error, context = {}] = args;
      baseLogger.error({
        ...context,
        error: formatError(error as Error),
      }, msgOrObj);
    } else {
      const [msg = ''] = args;
      baseLogger.error(msgOrObj, msg);
    }
  };
  return fn;
};

export const createLogger = (service: string, options = {}): Logger => {
  const baseLogger = createBaseLogger(service, options);

  return {
    level: baseLogger.level,
    silent: false,
    trace: createLogFn(baseLogger, 'trace'),
    debug: createLogFn(baseLogger, 'debug'),
    info: createLogFn(baseLogger, 'info'),
    warn: createLogFn(baseLogger, 'warn'),
    error: createErrorLogFn(baseLogger),
    fatal: createLogFn(baseLogger, 'fatal'),
    child: (bindings: Record<string, any>) => createLogger(service, { ...options, ...bindings }),
  };
};

export const logger = createLogger('default');

export const createErrorLogger = (baseLogger: Logger) => ({
  logError: (error: Error, context: Partial<LogContext> = {}) => {
    baseLogger.error(error.message, error, {
      service: context.service || 'unknown',
      environment: context.environment || process.env.NODE_ENV || 'development',
      ...context
    });
  }
});

// Re-export types
export type { Logger, LogContext } from '@eduflow/types';

// export type { LogLevel, LogFn } from './types';

// Re-export base types and utilities
// export * from './types';
// export * from './utils'; 