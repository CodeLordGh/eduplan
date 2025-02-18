# Exports from libs/logger

## index.ts

- `createLogger(service: string, options = {}): Logger`
  - Creates a logger instance with various log levels and a child logger function.
  - Returns a Logger object.

- `createErrorLogger(baseLogger: Logger)`
  - Creates an error logger that logs errors with additional context.
  - Returns an object with a `logError` function.

- `logger`
  - A default logger instance created with the service name 'default'.

## base.ts

- `createLogger(options: LoggerOptions): Logger`
  - Creates a logger instance with specified options, including log levels and child logger functionality.
  - Returns a Logger object.

- `createPinoLogger(options: LoggerOptions): PinoLogger`
  - Creates a Pino logger instance with the given options.
  - Returns a PinoLogger object.

- `createLogFunction(pinoLogger: PinoLogger, baseContext: Partial<LogContext>, level: LogLevel): LogFn`
  - Creates a log function for a specific log level.
  - Returns a LogFn function. 