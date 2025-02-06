# Error Handling Usage Guide for Microservices

## Overview
This guide explains how to effectively use the error handling system in microservices under the `apps` folder. The system provides a consistent, type-safe approach to error management following functional programming principles.

## Setup

### 1. Install Dependencies
```json
{
  "dependencies": {
    "@eduflow/common": "workspace:*",
    "@eduflow/constants": "workspace:*",
    "@eduflow/types": "workspace:*"
  }
}
```

### 2. Initialize Error Handling
```typescript
import { createAppError, createErrorResponse } from '@eduflow/common';
import { ERROR_CODES } from '@eduflow/constants';
import type { 
  AppError, 
  ErrorResponse 
} from '@eduflow/types';
```

## Usage Patterns

### 1. API Error Handling
```typescript
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import type { FastifyRequest, FastifyReply } from 'fastify';

const handleUserCreate = async (
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const result = await pipe(
    validateUserData(req.body),
    TE.chain(createUser),
    TE.mapLeft((error) => {
      req.log.error('User creation failed', { error });
      return error;
    })
  )();

  if (E.isLeft(result)) {
    const errorResponse = createErrorResponse(result.left);
    reply.status(result.left.statusCode).send(errorResponse);
    return;
  }

  reply.status(201).send(result.right);
};
```

### 2. Global Error Handler
```typescript
import { isAppError } from '@eduflow/common';

app.setErrorHandler((error: unknown, request, reply) => {
  request.log.error('Request failed', { error });

  const appError = isAppError(error)
    ? error
    : createAppError({
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred',
        cause: error,
        metadata: {
          service: 'api-service',
          operation: request.routerPath,
          timestamp: new Date(),
          requestId: request.id
        }
      });

  const errorResponse = createErrorResponse(appError);
  reply.status(appError.statusCode).send(errorResponse);
});
```

### 3. Service Layer Error Handling
```typescript
import { logger } from './logger';

const processUserData = (
  userId: string,
  data: UserData
): TE.TaskEither<AppError, ProcessedData> => {
  const operationLogger = logger.child({
    operation: 'processUserData',
    userId
  });

  return pipe(
    validateData(data),
    TE.mapLeft((error) => createAppError({
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Invalid user data',
      cause: error,
      metadata: {
        field: error.field,
        value: error.value,
        constraint: error.constraint
      }
    })),
    TE.chain((validData) => 
      pipe(
        processData(validData),
        TE.mapLeft((error) => {
          operationLogger.error('Data processing failed', { error });
          return createAppError({
            code: ERROR_CODES.SERVICE_ERROR,
            message: 'Failed to process user data',
            cause: error,
            metadata: {
              service: 'user-service',
              operation: 'processData',
              timestamp: new Date()
            }
          });
        })
      )
    )
  );
};
```

### 4. Background Job Error Handling
```typescript
const processEmailQueue = (
  job: EmailJob
): TE.TaskEither<AppError, void> => {
  const jobLogger = logger.child({
    jobId: job.id,
    operation: 'processEmail'
  });

  return pipe(
    validateEmailJob(job),
    TE.chain(sendEmail),
    TE.mapLeft((error) => {
      jobLogger.error('Email processing failed', { error });
      return createAppError({
        code: ERROR_CODES.SERVICE_ERROR,
        message: 'Failed to process email job',
        cause: error,
        metadata: {
          service: 'email-service',
          operation: 'processEmail',
          timestamp: new Date(),
          jobId: job.id
        }
      });
    })
  );
};
```

## Best Practices

### 1. API Error Handling
- Use global error handler for consistency
- Include request context in errors
- Return standardized error responses
- Log errors with appropriate context

### 2. Service Layer Errors
- Create domain-specific error types
- Use FP-TS for error handling
- Include operation context in errors
- Chain error transformations

### 3. Error Logging
- Log errors with full context
- Include correlation IDs
- Use appropriate log levels
- Structure error metadata

### 4. Error Categories
```typescript
// Authentication Errors
throwError({
  code: ERROR_CODES.UNAUTHORIZED,
  message: 'Invalid token',
  metadata: {
    userId: user.id,
    tokenExpiry: token.expiry
  }
});

// Validation Errors
throwError({
  code: ERROR_CODES.VALIDATION_ERROR,
  message: 'Invalid input',
  metadata: {
    field: 'email',
    value: input.email,
    constraint: 'email'
  }
});

// Resource Errors
throwError({
  code: ERROR_CODES.NOT_FOUND,
  message: 'Resource not found',
  metadata: {
    resourceType: 'user',
    resourceId: id
  }
});
```

### 5. Testing Error Scenarios
```typescript
import { expectError } from '@eduflow/common/testing';

describe('API Endpoints', () => {
  it('should handle invalid input', async () => {
    const response = await request(app)
      .post('/api/users')
      .send(invalidData);

    expect(response.status).toBe(400);
    expectError(response.body.error, {
      code: ERROR_CODES.VALIDATION_ERROR,
      metadata: {
        field: 'email'
      }
    });
  });
});
```

## Error Monitoring

### 1. Error Metrics
- Track error rates by category
- Monitor error patterns
- Set up alerts for critical errors
- Track error resolution time

### 2. Error Analytics
```typescript
const errorHandler = (error: AppError): void => {
  metrics.increment('errors', {
    code: error.code,
    service: error.metadata?.service
  });

  if (error.code === ERROR_CODES.INTERNAL_SERVER_ERROR) {
    alerts.notify('critical-error', {
      error,
      timestamp: new Date()
    });
  }
};
```

## Related Documentation
- [Error Handling Implementation](../../libs/common/docs/error-handling.md)
- [Library Integration Guide](../../libs/docs/error-handling-integration.md)
