/**
 * Log levels in order of severity (lowest to highest)
 */
export const LOG_LEVELS = {
  TRACE: 'trace',
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal'
} as const;

export type LogLevel = typeof LOG_LEVELS[keyof typeof LOG_LEVELS];

/**
 * Base context that should be included with every log
 */
export type BaseContext = {
  service: string;
  environment: string;
  timestamp: string;
  correlationId?: string;
};

/**
 * Additional context that can be added to any log
 */
export type LogContext = BaseContext & {
  [key: string]: unknown;
};

/**
 * Structure of a log entry
 */
export type LogEntry = {
  level: LogLevel;
  message: string;
  context: LogContext;
};

/**
 * Configuration options for the logger
 */
export type LoggerOptions = {
  service: string;
  environment?: string;
  minLevel?: LogLevel;
  redactPaths?: string[];
};

/**
 * Logger function signatures
 */
export type LogFn = (message: string, context?: Partial<LogContext>) => void;

export type Logger = {
  [K in LogLevel]: LogFn;
} & {
  child: (context: Partial<LogContext>) => Logger;
}; 