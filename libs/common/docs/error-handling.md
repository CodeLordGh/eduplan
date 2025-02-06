# Common Library Error Handling Documentation

## Overview
The common library provides error handling utilities and implementations used throughout the EduPlan application. This documentation covers the implementation details and usage examples. For the complete error type definitions, please refer to the [Error Types Documentation](../../types/docs/types.md#error-types) as the single source of truth.

## Architecture

### Error Flow
```mermaid
sequenceDiagram
    participant A as Application Code
    participant E as Error Handler
    participant L as Logger
    participant R as Response Formatter

    A->>E: Throw Error
    E->>E: Detect Error Type
    alt Known AppError
        E->>L: Log with Context
        E->>R: Format Response
    else Unknown Error
        E->>E: Wrap as Internal Error
        E->>L: Log with Stack
        E->>R: Format Generic Response
    end
    R-->>A: Return Formatted Error
```

## Core Components

### Base Error Utilities (`base.error.ts`)
```typescript
// Creates standardized AppError objects
export const createAppError = (details: ErrorDetails): AppError => ({
  name: 'AppError',
  message: details.message,
  code: details.code,
  statusCode: getStatusCode(details.code),
  metadata: details.metadata,
  cause: details.cause
});

// Utility for throwing AppErrors
export const throwError = (details: ErrorDetails): never => {
  throw createAppError(details);
};

// Formats errors for API responses
export const createErrorResponse = (error: AppError): ErrorResponse => ({
  error: {
    message: error.message,
    code: error.code,
    metadata: error.metadata
  }
});
```

For the complete error structure and type definitions, see the [Error Types Documentation](../../types/docs/types.md#error-types).

### Error Handler (`index.ts`)
The common library exports a global error handler that:
1. Detects if the error is a known AppError
2. For known errors: Returns them with appropriate status codes
3. For unknown errors: Wraps them as INTERNAL_SERVER_ERROR

```typescript
export const globalErrorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const appError = isAppError(error)
    ? error
    : createAppError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        cause: error
      });

  logger.error('Request failed', {
    error: appError,
    request: {
      method: req.method,
      path: req.path,
      params: req.params,
      query: req.query
    }
  });

  res.status(appError.statusCode).json(createErrorResponse(appError));
};
```

For status code mappings, see [HTTP Status Codes](../../constants/docs/constants.md#http-status-codes).

### Specialized Error Creators

#### Authentication Errors (`auth.error.ts`)
```typescript
export const createAuthenticationError = (
  message: string,
  metadata?: Record<string, unknown>
): ErrorDetails => ({
  code: 'AUTH_ERROR',
  message,
  metadata
});

export const createForbiddenError = (
  message: string,
  metadata?: Record<string, unknown>
): ErrorDetails => ({
  code: 'FORBIDDEN',
  message,
  metadata
});
```

#### File Operation Errors (`file.error.ts`)
```typescript
export const createFileAccessError = (
  path: string,
  operation: string
): ErrorDetails => ({
  code: 'FILE_ACCESS_ERROR',
  message: `Cannot ${operation} file: ${path}`,
  metadata: { path, operation }
});

export const createFileSizeError = (
  actualSize: string,
  maxSize: string
): ErrorDetails => ({
  code: 'FILE_SIZE_ERROR',
  message: `File size ${actualSize} exceeds limit of ${maxSize}`,
  metadata: { actualSize, maxSize }
});
```

### Error Utilities (`utils.ts`)
```typescript
// Type guard for AppError
export const isAppError = (error: unknown): error is AppError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
};

// Get HTTP status code for error code
export const getStatusCode = (code: ErrorCode): number => {
  switch (code) {
    case 'AUTH_ERROR':
      return 401;
    case 'FORBIDDEN':
      return 403;
    case 'NOT_FOUND':
      return 404;
    // ... other mappings
    default:
      return 500;
  }
};
```

## Functional Error Handling

### Using TaskEither
```typescript
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';

const processWithError = <T>(
  operation: () => Promise<T>,
  errorCreator: (error: unknown) => ErrorDetails
): TE.TaskEither<AppError, T> =>
  pipe(
    TE.tryCatch(
      operation,
      (error) => createAppError(errorCreator(error))
    )
  );
```

### Error Transformation
```typescript
const transformError = (
  error: AppError,
  context: Record<string, unknown>
): AppError => ({
  ...error,
  metadata: {
    ...error.metadata,
    ...context
  }
});
```

## Usage Examples

### Creating and Throwing Errors
```typescript
// Authentication error
throwError({
  code: 'AUTH_ERROR',
  message: 'Invalid credentials',
  metadata: {
    userId: '123'
  }
});

// File error
throwError({
  code: 'FILE_SIZE_ERROR',
  message: 'File exceeds size limit',
  metadata: {
    maxSize: '10MB',
    actualSize: '15MB'
  }
});
```

### Using Error Creators
```typescript
// Authentication
const authError = createAuthenticationError('Invalid token');

// File operations
const sizeError = createFileSizeError('15MB', '10MB');
```

### Error Response Format
```typescript
interface ErrorResponse {
  error: {
    message: string;
    code: ErrorCode;
    metadata?: Record<string, unknown>;
  };
}
```

## Best Practices

### Error Creation
1. Always use error creators for consistency
2. Include relevant context in metadata
3. Use specific error codes
4. Preserve error chains with `cause`

### Error Handling
1. Use functional error handling where possible
2. Log errors with appropriate context
3. Transform errors at boundaries
4. Handle all error cases explicitly

### Performance
1. Avoid throwing errors in hot paths
2. Use error codes for quick matching
3. Keep error metadata minimal
4. Cache error creators when possible

### Security
1. Sanitize error messages for external users
2. Remove sensitive data from error metadata
3. Use appropriate status codes
4. Log security-related errors separately

## Testing

### Error Testing Utilities
```typescript
export const expectError = (
  result: E.Either<AppError, unknown>,
  expected: Partial<AppError>
): void => {
  expect(E.isLeft(result)).toBe(true);
  if (E.isLeft(result)) {
    const error = result.left;
    expect(error).toMatchObject(expected);
  }
};
```

### Example Tests
```typescript
describe('Error Handling', () => {
  it('should create proper error response', () => {
    const error = createAppError({
      code: 'NOT_FOUND',
      message: 'Resource not found'
    });

    const response = createErrorResponse(error);
    expect(response.error.code).toBe('NOT_FOUND');
  });
});
```

## Related Documentation
- [Error Types](../types/docs/types.md#error-types)
- [HTTP Status Codes](../constants/docs/constants.md#http-status-codes)
- [Authentication](../types/docs/types.md#authentication-types)
- [Logger Integration](../logger/docs/logger.md#error-logging)