export {
  LOG_LEVELS,
  type LogLevel,
  type BaseContext,
  type LogContext,
  type LoggerOptions,
  type LogFn,
  type BaseLogger,
  type Logger,
  type RequestContext,
  type ErrorContext,
  type OperationContext,
  type RequestLogger,
  type ErrorLogger,
  type ServiceContext,
} from './types';

// Removed local definitions to resolve export conflicts
// export interface LogContext {
//   service: string;
//   environment: string;
//   timestamp?: string;
//   correlationId?: string;
//   [key: string]: unknown;
// }

// export type LogFn = (message: string, context?: Partial<LogContext>) => void;

// export interface Logger {
//   level: string;
//   silent: boolean;
//   trace: LogFn;
//   debug: LogFn;
//   info: LogFn;
//   warn: LogFn;
//   error: LogFn;
//   fatal: LogFn;
//   child: (bindings: Record<string, any>) => Logger;
// } 