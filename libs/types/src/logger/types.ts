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
  FATAL: 'fatal',
} as const;

export type LogLevel = (typeof LOG_LEVELS)[keyof typeof LOG_LEVELS];

/**
 * Base context that should be included with every log
 */
export interface BaseContext {
  service: string;
  environment: string;
  timestamp?: string;
  correlationId?: string;
}

/**
 * Additional context that can be added to any log
 */
export interface LogContext extends BaseContext {
  [key: string]: unknown;
}

/**
 * Configuration options for the logger
 */
export interface LoggerOptions {
  service: string;
  environment?: string;
  minLevel?: LogLevel;
  redactPaths?: string[];
  formatters?: {
    level?: (label: string) => Record<string, unknown>;
    bindings?: (bindings: Record<string, unknown>) => Record<string, unknown>;
    log?: (obj: Record<string, unknown>) => Record<string, unknown>;
  };
  serializers?: Record<string, (value: any) => any>;
}

/**
 * Base logger function type that matches Pino's signature
 */
export type LogFn = {
  (msg: string, ...args: any[]): void;
  (obj: object, msg?: string, ...args: any[]): void;
};

/**
 * Core logger interface that matches Pino's structure
 */
export interface BaseLogger {
  level: string;
  silent: boolean;
  [key: string]: any;
}

/**
 * Our extended logger interface
 */
export interface Logger extends BaseLogger {
  trace: LogFn;
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
  fatal: LogFn;
  child: (bindings: Record<string, any>) => Logger;
}

/**
 * Specialized context types for different logging scenarios
 */
export interface RequestContext extends BaseContext {
  path: string;
  method: string;
  userAgent?: string;
  ip?: string;
  userId?: string;
  sessionId?: string;
  duration?: number;
  statusCode?: number;
}

export interface ErrorContext extends BaseContext {
  code: ErrorCode;
  message: string;
  statusCode: number;
  metadata?: ErrorMetadata;
  stack?: string;
  requestId?: string;
  path?: string;
  method?: string;
  originalError?: unknown;
}

export interface OperationContext extends BaseContext {
  operation: string;
  duration?: number;
  result: 'success' | 'failure';
}

/**
 * Specialized logger types
 */
export interface RequestLogger extends Logger {
  request: (context: Partial<RequestContext>) => void;
  response: (context: Partial<RequestContext> & { statusCode: number; duration: number }) => void;
}

export interface ErrorLogger extends Logger {
  logError: (
    error: Error & { code?: string; statusCode?: number },
    context?: Partial<ErrorContext>
  ) => void;
  logErrorAndReturn: <E extends Error>(error: E, context?: Partial<ErrorContext>) => E;
}

export type ServiceContext =
  | 'api'
  | 'database'
  | 'cache'
  | 'queue'
  | 'auth'
  | 'file'
  | 'integration';
