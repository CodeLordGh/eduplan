# Logger Usage Guide

## Overview

This guide explains how to effectively use the logger library in your applications. The logger provides structured, type-safe logging with specialized support for HTTP requests and error handling.

## Quick Start

### 1. Installation

```json
{
  "dependencies": {
    "@eduplan/logger": "workspace:*"
  }
}
```

### 2. Basic Setup

```typescript
import { createLogger } from '@eduplan/logger';

const logger = createLogger({
  service: 'my-service',
  environment: process.env.NODE_ENV,
  minLevel: process.env.LOG_LEVEL || 'info',
  redactPaths: ['password', 'token', 'authorization', '*.secret'],
});
```

## Core Features

### 1. Standard Logging

```typescript
// Basic logging
logger.info('Application started');

// Logging with context
logger.info('User action completed', {
  userId: '123',
  action: 'profile_update',
  duration: 150,
});

// Different log levels
logger.debug('Debug information');
logger.warn('Warning message');
logger.error('Error occurred');
```

### 2. Child Loggers

```typescript
// Create a child logger with fixed context
const userLogger = logger.child({
  component: 'user-service',
  version: '1.0.0',
});

userLogger.info('User created', {
  userId: '123',
  email: 'user@example.com',
});
```

### 3. Request Logging

```typescript
import { createRequestLogger, createRequestLoggingMiddleware } from '@eduplan/logger';
import fastify from 'fastify';

const app = fastify();
const requestLogger = createRequestLogger(logger);

// Add automatic request logging
app.addHook('onRequest', createRequestLoggingMiddleware(logger));

// Add custom request context
app.addHook('preHandler', (request, reply, done) => {
  request.log = requestLogger.child({
    userId: request.user?.id,
    tenant: request.headers['x-tenant-id'],
  });
  done();
});

// Use in route handlers
app.post('/users', async (request, reply) => {
  request.log.info('Creating user', {
    email: request.body.email,
    role: request.body.role,
  });
  // ... handler logic
});
```

### 4. Error Logging

```typescript
import { createErrorLogger } from '@eduplan/logger';

const errorLogger = createErrorLogger(logger);

// Basic error logging
try {
  await someOperation();
} catch (error) {
  errorLogger.logError(error, {
    operation: 'user_creation',
    userId: user.id,
  });
}

// Error logging with return
const result = await pipe(
  someOperation(),
  TE.mapLeft((error) =>
    errorLogger.logErrorAndReturn(error, {
      context: 'payment_processing',
    })
  )
);
```

## Best Practices

### 1. Service Configuration

```typescript
// config/logger.ts
export const createServiceLogger = () =>
  createLogger({
    service: process.env.SERVICE_NAME || 'unknown-service',
    environment: process.env.NODE_ENV,
    minLevel: process.env.LOG_LEVEL || 'info',
    redactPaths: [
      'password',
      'token',
      'authorization',
      '*.secret',
      'body.creditCard',
      'headers.cookie',
    ],
  });
```

### 2. Request Context

```typescript
// middleware/logging.ts
export const addRequestLogging = (app: FastifyInstance) => {
  const requestLogger = createRequestLogger(logger);

  app.addHook('onRequest', createRequestLoggingMiddleware(logger));

  app.addHook('preHandler', (request, reply, done) => {
    request.log = requestLogger.child({
      correlationId: request.id,
      userId: request.user?.id,
      tenant: request.headers['x-tenant-id'],
      clientVersion: request.headers['x-client-version'],
    });
    done();
  });
};
```

### 3. Error Handling

```typescript
// utils/error-handling.ts
export const handleError = (error: unknown, context: Record<string, unknown>) => {
  const errorLogger = createErrorLogger(logger);

  if (error instanceof AppError) {
    errorLogger.logError(error, context);
    return error;
  }

  const wrappedError = createAppError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    cause: error,
  });

  errorLogger.logError(wrappedError, context);
  return wrappedError;
};
```

### 4. Performance Logging

```typescript
// utils/performance.ts
export const withPerformanceLogging = async <T>(
  operation: string,
  fn: () => Promise<T>,
  context: Record<string, unknown> = {}
): Promise<T> => {
  const start = process.hrtime();

  try {
    const result = await fn();
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds * 1000 + nanoseconds / 1000000;

    logger.info(`Operation ${operation} completed`, {
      ...context,
      operation,
      duration,
      success: true,
    });

    return result;
  } catch (error) {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds * 1000 + nanoseconds / 1000000;

    errorLogger.logError(error, {
      ...context,
      operation,
      duration,
      success: false,
    });

    throw error;
  }
};
```

## Security Considerations

1. **Never Log Sensitive Data**

   - Use redactPaths for sensitive fields
   - Be careful with error messages
   - Validate logged data

2. **Production Settings**

   - Use appropriate log levels
   - Limit stack traces
   - Configure proper log rotation

3. **Context Validation**
   - Sanitize user input
   - Validate context objects
   - Limit context size

## Related Documentation

- [Logger Implementation](../../libs/logger/docs/logger.md)
- [Types Documentation](../../libs/types/docs/types.md)
- [Error Handling Guide](../../libs/common/docs/error-handling.md)
