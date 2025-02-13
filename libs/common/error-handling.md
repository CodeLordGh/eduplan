# Common Library Error Handling Documentation

## Overview

The common library provides the core error handling utilities and implementations used throughout the EduPlan application. It implements the base error handling system and provides specialized error creators for common scenarios.

## Core Components

### Base Error Utilities (`base.error.ts`)

- `createAppError`: Creates standardized AppError objects
- `throwError`: Utility for throwing AppErrors
- `createErrorResponse`: Formats errors for API responses
- Maintains HTTP status code mappings for all error types

### Error Handler (`index.ts`)

The common library exports a global error handler that:

1. Detects if the error is a known AppError
2. For known errors: Returns them with appropriate status codes
3. For unknown errors: Wraps them as INTERNAL_SERVER_ERROR
4. Always returns errors in the standard ErrorResponse format

### Specialized Error Creators

#### Authentication Errors (`auth.error.ts`)

- `createAuthenticationError`: For general authentication failures
- `createForbiddenError`: For permission-related issues

#### File Operation Errors (`file.error.ts`)

- `createFileAccessError`: For file access permission issues
- `createFileSizeError`: For file size limit violations
- `createFileQuotaError`: For storage quota exceeded scenarios

### Error Utilities (`utils.ts`)

Helper functions for common error handling scenarios and error transformation operations.

## Usage Examples

### Creating and Throwing Errors

```typescript
// Authentication error
throwError({
  code: 'AUTH_ERROR',
  message: 'Invalid credentials',
  metadata: {
    userId: '123',
  },
});

// File error
throwError({
  code: 'FILE_SIZE_ERROR',
  message: 'File exceeds size limit',
  metadata: {
    filename: 'large.pdf',
    size: 15000000,
  },
});
```

### Using the Error Handler

```typescript
app.setErrorHandler(errorHandler);
```

### Creating Custom Errors

```typescript
const error = createAppError({
  code: 'VALIDATION_ERROR',
  message: 'Invalid input',
  metadata: {
    field: 'email',
    value: 'invalid-email',
    constraint: 'email',
  },
});
```

## Integration Points

1. **FastifyError Integration**: The error handler seamlessly integrates with Fastify's error system
2. **Type System**: All error utilities are fully typed and integrate with the types defined in @eduflow/types
3. **Logging**: Error handling components integrate with the logging system for proper error tracking

## Best Practices for Common Library

1. Always use the provided error creators instead of throwing raw errors
2. Include appropriate metadata for better error context
3. Maintain error type safety by using the predefined error types
4. Use the error handler at the application level for consistent error handling
5. Keep error messages clear and actionable
