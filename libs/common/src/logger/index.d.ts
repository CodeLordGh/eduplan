import pino from 'pino';
export type LogContext = Record<string, unknown>;
export type LogLevel = 'info' | 'error' | 'warn' | 'debug' | 'trace';
export declare const createLogger: (service: string, options?: pino.LoggerOptions) => {
    info: (message: string, context?: LogContext) => void;
    error: (message: string, error?: Error, context?: LogContext) => void;
    warn: (message: string, context?: LogContext) => void;
    debug: (message: string, context?: LogContext) => void;
    trace: (message: string, context?: LogContext) => void;
};
//# sourceMappingURL=index.d.ts.map