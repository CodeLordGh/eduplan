import { ErrorCode, ErrorMetadata } from '../errors/types';

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

export type ServiceContext = 'api' | 'database' | 'cache' | 'queue' | 'auth' | 'file' | 'integration';

export interface RequestContext extends BaseContext {
  path: string;
  method: string;
  userAgent?: string;
  ip?: string;
  userId?: string;
  sessionId?: string;
}

export interface ErrorContext extends BaseContext {
  code: ErrorCode;
  message: string;
  statusCode: number;
  metadata?: ErrorMetadata;
  stack?: string;
}

export interface OperationContext extends BaseContext {
  operation: string;
  duration?: number;
  result: 'success' | 'failure';
}

export interface RequestLogger extends Logger {
  request: (context: Partial<RequestContext>) => void;
  response: (context: Partial<RequestContext> & { statusCode: number; duration: number }) => void;
} 