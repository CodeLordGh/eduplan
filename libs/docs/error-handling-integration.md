# Error Handling Integration Guide for Libraries

## Overview

This guide focuses on integrating the error handling system into libraries under the `libs` folder. For a complete understanding of the error handling system, please refer to the [Error Handling Documentation](../common/docs/error-handling.md).

## Quick Start

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
import type { AppError, ErrorDetails, ErrorMetadata } from '@eduflow/types';
```

## Integration Patterns

### 1. Functional Error Handling with fp-ts

```typescript
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import type { AppError } from '@eduflow/types';

const validateUserData = (data: unknown): TE.TaskEither<AppError, ValidatedData> =>
  pipe(
    TE.tryCatch(
      () => validator.validate(data),
      (error) => createAppError(createUserValidationError('data', data, 'schema'))
    )
  );

const processUser = (userData: unknown): TE.TaskEither<AppError, User> =>
  pipe(
    validateUserData(userData),
    TE.chain(saveUser),
    TE.mapLeft((error) => {
      logger.error('User processing failed', { error });
      return error;
    })
  );
```

### 2. Error Propagation with Context

```typescript
import type { OperationContext } from './types';

export const performOperation = (context: OperationContext): TE.TaskEither<AppError, Result> => {
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

### 3. Domain-Specific Error Integration

```typescript
// Define domain-specific error creators
const createUserNotFoundError = (userId: string): ErrorDetails => ({
  code: ERROR_CODES.NOT_FOUND,
  message: `User with ID ${userId} not found`,
  metadata: {
    resourceType: 'user',
    resourceId: userId,
  },
});

// Use in your service
const getUser = async (userId: string): Promise<User> => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throwError(createUserNotFoundError(userId));
  }
  return user;
};
```

## Testing Integration

### 1. Error Testing Utilities

```typescript
import { expectError } from '@eduflow/common/testing';

describe('User Operations', () => {
  it('should handle invalid user data', async () => {
    const result = await processUser(invalidData)();

    expectError(result, {
      code: ERROR_CODES.VALIDATION_ERROR,
      metadata: {
        field: 'email',
        constraint: 'email',
      },
    });
  });
});
```

### 2. Error Chain Testing

```typescript
describe('Error Propagation', () => {
  it('should preserve error context through the chain', async () => {
    const result = await pipe(
      performOperation(context),
      TE.mapLeft((error) => {
        expect(error.metadata).toHaveProperty('operationType');
        expect(error.metadata).toHaveProperty('details');
        return error;
      })
    )();
  });
});
```

## Best Practices for Integration

### 1. Error Creation

- Create domain-specific error factory functions
- Use the error creators from `@eduflow/common`
- Include relevant context in error metadata
- Follow the error structure defined in the [Error Types Documentation](../types/docs/types.md#error-types)

### 2. Error Handling

- Use FP-TS for functional error handling
- Properly propagate errors through the chain
- Add appropriate logging at boundaries
- Preserve error context when transforming errors

### 3. Testing

- Use provided testing utilities
- Test error cases explicitly
- Verify error metadata
- Test error propagation

## Related Documentation

### Core Documentation

- [Error Handling Documentation](../common/docs/error-handling.md) - Complete error handling system documentation
- [Error Types](../types/docs/types.md#error-types) - Error type definitions
- [HTTP Status Codes](../constants/docs/constants.md#http-status-codes) - Status code mappings

### Implementation Details

- [Logger Integration](../logger/docs/logger.md#error-logging) - Error logging integration
- [Testing Utilities](../common/docs/testing.md) - Error testing utilities
