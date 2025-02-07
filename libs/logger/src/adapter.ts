import { Logger as PinoLogger } from 'pino';
import { Logger, LogContext, LogLevel, LogFn as TypesLogFn } from '@eduflow/types';
import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as R from 'fp-ts/Reader';

type LogFn = TypesLogFn;
type LoggerEnv = { pinoLogger: PinoLogger };

/**
 * Creates a logging function for a specific level
 */
const createLogFn = (level: LogLevel): R.Reader<LoggerEnv, LogFn> =>
  ({ pinoLogger }) =>
    (msgOrObj: any, ...args: any[]) =>
      pinoLogger[level](msgOrObj, ...args);

/**
 * Creates a child logger with additional context
 */
const createChild = (context: Partial<LogContext>): R.Reader<LoggerEnv, Logger> =>
  ({ pinoLogger }) => createLoggerAdapter(pinoLogger.child(context));

/**
 * Creates a logger adapter with all logging functions
 */
export const createLoggerAdapter = (pinoLogger: PinoLogger): Logger => {
  const env: LoggerEnv = { pinoLogger };

  return {
    level: pinoLogger.level,
    silent: false,
    trace: pipe(createLogFn('trace')(env)),
    debug: pipe(createLogFn('debug')(env)),
    info: pipe(createLogFn('info')(env)),
    warn: pipe(createLogFn('warn')(env)),
    error: pipe(createLogFn('error')(env)),
    fatal: pipe(createLogFn('fatal')(env)),
    child: (context) => pipe(createChild(context)(env))
  };
};

/**
 * Helper to safely handle undefined context
 */
const withContext = (context?: Partial<LogContext>): Partial<LogContext> =>
  pipe(
    O.fromNullable(context),
    O.getOrElse(() => ({}))
  ); 