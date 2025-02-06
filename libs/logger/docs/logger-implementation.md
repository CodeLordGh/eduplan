# Logger Implementation Documentation

## Overview
The logger library provides a functional, type-safe logging infrastructure built on top of Pino. It follows functional programming principles and provides specialized logging utilities for different use cases.

## Source Files Structure

### Core Files
- `src/base.ts`: Core logging functionality and logger creation
- `src/error.ts`: Error handling and logging utilities
- `src/request.ts`: HTTP request logging middleware
- `src/types.ts`: TypeScript type definitions
- `src/index.ts`: Public API exports

## Type System (`types.ts`)

### Core Types
```typescript
type LogFn = (message: string, context?: Partial<LogContext>) => void;

interface Logger {
  trace: LogFn;
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
  fatal: LogFn;
  child: (bindings: Record<string, unknown>) => Logger;
}

interface LoggerOptions {
  service: string;
  environment?: string;
  minLevel?: LogLevel;
  redactPaths?: string[];
}
```

### Context Types
```typescript
type ServiceContext = 'api' | 'database' | 'cache' | 'queue' | 'auth' | 'file' | 'integration';

interface RequestContext extends BaseContext {
  path: string;
  method: string;
  userAgent?: string;
  ip?: string;
  userId?: string;
  sessionId?: string;
}

interface ErrorContext extends BaseContext {
  code: ErrorCode;
  message: string;
  statusCode: number;
  metadata?: ErrorMetadata;
  stack?: string;
}

interface OperationContext extends BaseContext {
  operation: string;
  duration?: number;
  result: 'success' | 'failure';
}

interface RequestLogger extends Logger {
  request: (context: Partial<RequestContext>) => void;
  response: (context: Partial<RequestContext> & { 
    statusCode: number; 
    duration: number 
  }) => void;
}
```

## Core Functions

### Base Logger (`base.ts`)

#### `createLogger(options: LoggerOptions): Logger`
Creates a new logger instance with the specified options.
```typescript
const logger = createLogger({
  service: 'api-service',
  environment: 'production',
  minLevel: LOG_LEVELS.INFO,
  redactPaths: ['*.password', '*.token']
});
```

#### `createPinoLogger(options: LoggerOptions): pino.Logger`
Internal function that creates the underlying Pino logger instance with configured options.

#### `createLogFunction(pinoLogger: pino.Logger, baseContext: Partial<LogContext>, level: LogLevel): LogFn`
Internal function that creates a log function for a specific level.

### Error Logger (`error.ts`)

#### `createErrorLogger(logger: Logger)`
Creates an error logging utility with FP-TS integration.
```typescript
const errorLogger = createErrorLogger(logger);
```

##### Methods
- `logError(error: AppError, context?: Partial<LogContext>): TE.TaskEither<Error, void>`
  Logs an error with full context.
  
- `logErrorAndReturn(context?: Partial<LogContext>): (error: AppError) => TE.TaskEither<AppError, never>`
  Logs an error and returns it (useful in fp-ts pipes).

#### `extractErrorDetails(error: AppError): Partial<LogContext>`
Internal function that extracts structured error details for logging.

### Request Logger (`request.ts`)

#### `createRequestLogger(logger: Logger)`
Creates HTTP request logging middleware.
```typescript
const requestLogger = createRequestLogger(logger);
app.addHook('onRequest', requestLogger);
```

#### `extractRequestInfo(request: FastifyRequest): Partial<LogContext>`
Internal function that extracts relevant request information for logging.

#### `extractResponseInfo(reply: FastifyReply): Partial<LogContext>`
Internal function that extracts relevant response information for logging.

## Usage Patterns

### Basic Logging
```typescript
const logger = createLogger({
  service: 'user-service',
  environment: 'production'
});

logger.info('Operation completed', {
  userId: '123',
  operation: 'profile_update',
  duration: 150
});
```

### Error Handling with FP-TS
```typescript
const errorLogger = createErrorLogger(logger);

pipe(
  operation,
  TE.chainFirst(errorLogger.logErrorAndReturn({
    component: 'auth',
    operation: 'login'
  }))
);
```

### Request Lifecycle Logging
```typescript
const requestLogger = createRequestLogger(logger);

// Automatic request/response logging
app.addHook('onRequest', requestLogger);

// Manual request context logging
const reqLogger = logger.child({
  path: req.path,
  method: req.method,
  userId: req.user?.id
});
```

## Best Practices

### 1. Logger Configuration
- Create a single logger instance per service
- Configure appropriate log levels per environment
- Use redaction patterns for sensitive data
- Set meaningful service names for easy identification

### 2. Context and Type Safety
- Leverage TypeScript types for context objects
- Use child loggers to maintain context across operations
- Include correlation IDs for request tracing
- Follow the defined context interfaces

### 3. Error Handling
- Use `createErrorLogger` for consistent error logging
- Include complete error context and stack traces
- Leverage FP-TS integration in functional code paths
- Extract and standardize error details

### 4. Performance Considerations
- Use child loggers instead of creating new contexts
- Check log levels before expensive operations
- Configure appropriate log sampling in high-traffic services
- Use asynchronous logging when possible

### 5. Security
- Never log sensitive data (passwords, tokens, etc.)
- Configure redaction patterns for sensitive fields
- Validate log data in production environments
- Use appropriate log levels for security events

## Default Configuration

### Log Levels
- TRACE: Verbose debugging
- DEBUG: Debugging information
- INFO: Normal operation
- WARN: Warning conditions
- ERROR: Error conditions
- FATAL: Critical failures

### Default Options
```typescript
const DEFAULT_OPTIONS = {
  environment: process.env.NODE_ENV || 'development',
  minLevel: LOG_LEVELS.INFO,
  redactPaths: [
    'req.headers.authorization',
    '*.password',
    '*.token',
    '*.secret',
    '*.key'
  ]
};
```

## Related Documentation
- [Integration Guide for Libraries](../../../libs/docs/logger-integration.md)
- [Microservices Usage Guide](../../../apps/docs/logger-usage.md)
