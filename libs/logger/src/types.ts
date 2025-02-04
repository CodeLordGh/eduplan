import { 
  LOG_LEVELS,
  LogLevel,
  LogContext,
  Logger,
  LoggerOptions,
  BaseContext,
  ErrorCode,
  ErrorMetadata
} from '@eduflow/types';

export type LogFn = (message: string, context?: Partial<LogContext>) => void;

export { LOG_LEVELS };
export type {
  LogLevel,
  LogContext,
  Logger,
  LoggerOptions,
  BaseContext
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