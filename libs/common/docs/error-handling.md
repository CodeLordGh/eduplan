# Common Library Error Handling Documentation

## Overview
The common library provides error handling utilities and implementations used throughout the EduPlan application. This documentation covers the implementation details and usage examples. For the complete error type definitions, please refer to the [Error Types Documentation](../../types/docs/types.md#error-types) as the single source of truth.

## Core Components

### Base Error Utilities (`base.error.ts`)
- `createAppError`: Creates standardized AppError objects
- `throwError`: Utility for throwing AppErrors
- `createErrorResponse`: Formats errors for API responses

For the complete error structure and type definitions, see the [Error Types Documentation](../../types/docs/types.md#error-types).

### Error Handler (`index.ts`)
The common library exports a global error handler that:
1. Detects if the error is a known AppError
2. For known errors: Returns them with appropriate status codes
3. For unknown errors: Wraps them as INTERNAL_SERVER_ERROR

For status code mappings, see [HTTP Status Codes](../../constants/docs/constants.md#http-status-codes).

### Specialized Error Creators

#### Authentication Errors (`auth.error.ts`)
- `createAuthenticationError`: For general authentication failures
- `createForbiddenError`: For permission-related issues

For authentication error types, see the [Error Types Documentation](../../types/docs/types.md#error-types).

#### File Operation Errors (`file.error.ts`)
- `createFileAccessError`: For file access permission issues
- `createFileSizeError`: For file size limit violations
- `createFileQuotaError`: For storage quota exceeded scenarios

For file operation error types, see the [Error Types Documentation](../../types/docs/types.md#error-types).

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
For the complete error response format, see the [Error Types Documentation](../types/docs/types.md#error-types).

## Related Documentation
- [Error Types](../types/docs/types.md#error-types)
- [HTTP Status Codes](../constants/docs/constants.md#http-status-codes)
- [Authentication](../types/docs/types.md#authentication-types)
- [Logger Integration](../logger/docs/logger.md#error-logging)