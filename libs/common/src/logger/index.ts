import pino from 'pino';

export type LogContext = Record<string, unknown>;
export type LogLevel = 'info' | 'error' | 'warn' | 'debug' | 'trace';

const createBaseLogger = (service: string, options: pino.LoggerOptions = {}) =>
  pino({
    level: process.env.LOG_LEVEL || 'info',
    formatters: {
      level: (label: string) => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    name: service,
    ...options,
  });

const formatError = (error?: Error): Record<string, unknown> | undefined =>
  error
    ? {
        message: error.message,
        stack: error.stack,
      }
    : undefined;

const createLogFn =
  (logger: pino.Logger, level: LogLevel) =>
  (message: string, context: LogContext = {}) =>
    logger[level]({ ...context }, message);

const createErrorLogFn =
  (logger: pino.Logger) =>
  (message: string, error?: Error, context: LogContext = {}) =>
    logger.error(
      {
        ...context,
        error: formatError(error),
      },
      message
    );

export const createLogger = (service: string, options?: pino.LoggerOptions) => {
  const baseLogger = createBaseLogger(service, options);

  return {
    info: createLogFn(baseLogger, 'info'),
    error: createErrorLogFn(baseLogger),
    warn: createLogFn(baseLogger, 'warn'),
    debug: createLogFn(baseLogger, 'debug'),
    trace: createLogFn(baseLogger, 'trace'),
  };
};
