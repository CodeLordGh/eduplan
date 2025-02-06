# Error Handling Integration Guide for Libraries

## Overview
This guide explains how to integrate the error handling system into libraries under the `libs` folder. The system follows functional programming principles and provides type-safe error handling.

## Integration Steps

### 1. Add Dependencies
In your library's `package.json`:
```json
{
  "dependencies": {
    "@eduflow/common": "workspace:*",
    "@eduflow/constants": "workspace:*",
    "@eduflow/types": "workspace:*"
  }
}
```

### 2. Import Required Modules
```typescript
import { createAppError, throwError } from '@eduflow/common';
import { ERROR_CODES } from '@eduflow/constants';
import type { 
  AppError, 
  ErrorDetails, 
  ErrorMetadata 
} from '@eduflow/types';
```

### 3. Define Domain-Specific Errors

```typescript
// userErrors.ts
import type { ErrorDetails } from '@eduflow/types';

export const createUserNotFoundError = (userId: string): ErrorDetails => ({
  code: ERROR_CODES.NOT_FOUND,
  message: `User with ID ${userId} not found`,
  metadata: {
    resourceType: 'user',
    resourceId: userId
  }
});

export const createUserValidationError = (
  field: string,
  value: unknown,
  constraint: string
): ErrorDetails => ({
  code: ERROR_CODES.VALIDATION_ERROR,
  message: `Invalid user ${field}`,
  metadata: {
    field,
    value,
    constraint
  }
});
```

## Usage Patterns

### 1. Functional Error Handling
```typescript
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import type { AppError } from '@eduflow/types';

const validateUserData = (
  data: unknown
): TE.TaskEither<AppError, ValidatedData> =>
  pipe(
    TE.tryCatch(
      () => validator.validate(data),
      (error) => createAppError(
        createUserValidationError('data', data, 'schema')
      )
    )
  );

const processUser = (
  userData: unknown
): TE.TaskEither<AppError, User> =>
  pipe(
    validateUserData(userData),
    TE.chain(saveUser),
    TE.mapLeft((error) => {
      logger.error('User processing failed', { error });
      return error;
    })
  );
```

### 2. Error Propagation
```typescript
import type { OperationContext } from './types';

export const performOperation = (
  context: OperationContext
): TE.TaskEither<AppError, Result> => {
  const { logger } = context;

  return pipe(
    validateInput(context),
    TE.chain(processInput),
    TE.mapLeft((error) => {
      logger.error('Operation failed', { error });
      return error;
    })
  );
};
```

### 3. Custom Error Types
```typescript
// Define custom error metadata
type CustomErrorMetadata = {
  operationType: string;
  details: Record<string, unknown>;
};

// Create custom error
const createCustomError = (
  operationType: string,
  details: Record<string, unknown>
): ErrorDetails => ({
  code: ERROR_CODES.SERVICE_ERROR,
  message: `Operation ${operationType} failed`,
  metadata: {
    operationType,
    details
  }
});
```

## Best Practices

### 1. Error Creation
- Create domain-specific error factory functions
- Include relevant context in error metadata
- Use consistent error messages
- Preserve error chains with `cause`

### 2. Error Handling
- Use FP-TS for functional error handling
- Handle all possible error cases
- Log errors appropriately
- Propagate errors with context

### 3. Type Safety
- Use provided type definitions
- Create custom error metadata types
- Validate error structure at compile time
- Export error-related types

### 4. Testing
```typescript
import { expectError } from '@eduflow/common/testing';

describe('User Operations', () => {
  it('should handle invalid user data', async () => {
    const result = await processUser(invalidData)();
    
    expectError(result, {
      code: ERROR_CODES.VALIDATION_ERROR,
      metadata: {
        field: 'email',
        constraint: 'email'
      }
    });
  });
});
```

## Available Error Types

### Core Error Types
```typescript
type ErrorCategory =
  | 'AUTH'
  | 'RESOURCE'
  | 'VALIDATION'
  | 'FILE'
  | 'SYSTEM';

interface AppError {
  name: string;
  message: string;
  statusCode: number;
  code: ErrorCode;
  cause?: unknown;
  metadata?: ErrorMetadata[keyof ErrorMetadata];
}
```

For a complete list of error types and utilities, refer to the [Error Handling Documentation](../common/docs/error-handling.md).

## Related Documentation
- [Error Handling Implementation](../common/docs/error-handling.md)
- [Microservices Error Handling](../../apps/docs/error-handling-usage.md)
