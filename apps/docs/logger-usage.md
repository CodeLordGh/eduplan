# Logger Usage Guide for Microservices

## Overview
This guide explains how to effectively use the logger library in microservices under the `apps` folder. The logger implementation follows functional programming principles, avoiding classes and mutable state.

## Setup

### 1. Install Dependencies
```json
{
  "dependencies": {
    "@eduplan/logger": "workspace:*"
  }
}
```

### 2. Initialize Logger
```typescript
import { createLogger } from '@eduplan/logger';
import type { Logger, LogContext } from '@eduplan/logger';

// Create a single logger instance for the service
export const logger = createLogger({
  service: 'your-service-name',
  environment: process.env.NODE_ENV,
  minLevel: process.env.LOG_LEVEL || 'info',
  redactPaths: [
    'body.password', 
    'headers.authorization',
    '*.token',
    '*.secret'
  ]
});

// Export types for consumers
export type { Logger, LogContext };
```

## Usage Patterns

### 1. HTTP Request Handling
```typescript
import { createLogger, createRequestLogger } from '@eduplan/logger';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';

const logger = createLogger({ service: 'api-service' });
const requestLogger = createRequestLogger(logger);

// Add automatic request logging middleware
app.addHook('onRequest', requestLogger);

// Route handler with context-aware logging
const handleUserCreate = async (req: FastifyRequest, reply: FastifyReply) => {
  const routeLogger = logger.child({
    path: req.url,
    method: req.method,
    userId: req.user?.id,
    correlationId: req.id
  });

  routeLogger.info('Processing user creation request');

  return pipe(
    createUser(req.body),
    TE.tap(() => TE.right(routeLogger.info('User created successfully'))),
    TE.mapLeft((error) => {
      routeLogger.error('User creation failed', { error });
      return error;
    })
  )();
};
```

### 2. Service Layer Operations
```typescript
import { logger } from './logger';
import type { TaskEither } from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';

export const processUserData = (
  userId: string,
  data: UserData
): TaskEither<Error, ProcessedData> => {
  const operationLogger = logger.child({
    operation: 'processUserData',
    userId,
    dataType: data.type
  });

  return pipe(
    TE.tryCatch(
      () => validateData(data),
      (error) => error as Error
    ),
    TE.chain((validData) => 
      TE.tryCatch(
        () => transformData(validData),
        (error) => error as Error
      )
    ),
    TE.tap((result) => 
      TE.right(operationLogger.info('Data processing completed', { result }))
    ),
    TE.mapLeft((error) => {
      operationLogger.error('Data processing failed', { error });
      return error;
    })
  );
};
```

### 3. Background Jobs
```typescript
import { logger } from './logger';
import type { TaskEither } from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';

export const processEmailQueue = (job: EmailJob): TaskEither<Error, void> => {
  const jobLogger = logger.child({
    jobId: job.id,
    operation: 'processEmail',
    emailType: job.type
  });

  return pipe(
    TE.tryCatch(
      () => sendEmail(job.data),
      (error) => error as Error
    ),
    TE.tap(() => 
      TE.right(jobLogger.info('Email sent successfully'))
    ),
    TE.mapLeft((error) => {
      jobLogger.error('Email sending failed', { error });
      return error;
    })
  );
};
```

## Best Practices

### 1. Service Configuration
- Create a single logger instance per service
- Configure appropriate log levels per environment
- Use meaningful service names
- Set up proper redaction patterns

### 2. Request Handling
- Use request logging middleware
- Create child loggers with request context
- Include correlation IDs
- Log request validation errors

### 3. Error Management
- Use FP-TS for error handling
- Log errors with full context
- Include stack traces in development
- Use appropriate error levels

### 4. Context and Type Safety
- Use TypeScript types for all contexts
- Follow the logger's type system
- Maintain consistent context fields
- Include relevant business context

### 5. Performance
- Check log levels before expensive operations
- Use child loggers efficiently
- Configure appropriate sampling
- Monitor log volume

### 6. Security
- Never log sensitive data
- Use redaction patterns
- Validate log data
- Audit logging practices

## Available Context Types

### Request Context
```typescript
interface RequestContext extends BaseContext {
  path: string;
  method: string;
  userAgent?: string;
  ip?: string;
  userId?: string;
  sessionId?: string;
}
```

### Operation Context
```typescript
interface OperationContext extends BaseContext {
  operation: string;
  duration?: number;
  result: 'success' | 'failure';
}
```

For a complete list of available types and functions, refer to the [Logger Implementation Documentation](../../libs/logger/docs/logger-implementation.md).

## Monitoring and Alerts

### Common Patterns
1. Error Rate Monitoring
   ```typescript
   logger.error('Critical operation failed', {
     operation: 'payment_processing',
     errorCode: 'PAYMENT_DECLINED',
     severity: 'critical'
   });
   ```

2. Performance Tracking
   ```typescript
   const start = performance.now();
   // ... operation ...
   logger.info('Operation completed', {
     operation: 'data_sync',
     duration: performance.now() - start,
     itemsProcessed: 1000
   });
   ```

### Alert Configuration
- Set up alerts for error-level logs
- Monitor operation durations
- Track error rates by service
- Alert on security events

## Related Documentation
- [Logger Implementation Details](../../libs/logger/docs/logger-implementation.md)
- [Library Integration Guide](../../libs/docs/logger-integration.md)
