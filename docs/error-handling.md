# Error Handling System Documentation

## Overview

The error handling system in EduPlan is designed to provide a consistent, type-safe, and comprehensive way to handle errors across the entire application. It follows a hierarchical structure with predefined error categories and standardized error responses.

## Error Categories

The system defines five high-level error categories:

- **AUTH**: Authentication & Authorization errors
- **RESOURCE**: Resource-related errors
- **VALIDATION**: Input validation errors
- **FILE**: File operation errors
- **SYSTEM**: System-level errors

## Error Codes

Each category contains specific error codes that provide more detailed information about the error:

### AUTH

- `AUTH_ERROR` (401): General authentication errors
- `UNAUTHORIZED` (403): User is not authenticated
- `FORBIDDEN` (403): User lacks required permissions

### RESOURCE

- `NOT_FOUND` (404): Requested resource doesn't exist
- `CONFLICT` (409): Resource conflict (e.g., duplicate entries)

### VALIDATION

- `VALIDATION_ERROR` (400): Input validation failed
- `BAD_REQUEST` (400): Malformed request

### FILE

- `FILE_SIZE_ERROR` (413): File size exceeds limit
- `FILE_TYPE_ERROR` (415): Unsupported file type
- `FILE_QUOTA_ERROR` (507): Storage quota exceeded
- `FILE_ACCESS_ERROR` (403): File access denied
- `FILE_NOT_FOUND` (404): File not found

### SYSTEM

- `INTERNAL_SERVER_ERROR` (500): Unexpected server error
- `SERVICE_UNAVAILABLE` (503): Service temporarily unavailable

## Error Structure

All errors in the system follow a standardized structure:

```typescript
interface AppError {
  name: string; // Error name (matches error code)
  message: string; // Human-readable error message
  statusCode: number; // HTTP status code
  code: ErrorCode; // Error code from predefined list
  cause?: unknown; // Original error that caused this error
  metadata?: ErrorMetadata; // Additional error context
}
```

## Error Metadata

Each error type can include specific metadata to provide additional context:

### Validation Error Metadata

```typescript
{
  field: string;          // Field that failed validation
  value: unknown;         // Invalid value
  constraint: string;     // Validation constraint that failed
  additionalFields?: Record<string, unknown>;
}
```

### File Error Metadata

```typescript
{
  filename: string;
  size?: number;
  type?: string;
  path?: string;
  quota?: {
    used: number;
    limit: number;
  }
}
```

### Auth Error Metadata

```typescript
{
  userId?: string;
  requiredRoles?: string[];
  actualRoles?: string[];
  tokenExpiry?: Date;
}
```

### System Error Metadata

```typescript
{
  service: string;
  operation: string;
  timestamp: Date;
  requestId?: string;
}
```

## Error Handling Flow

1. Errors are created using the `createAppError` utility with appropriate error details
2. The global error handler (`errorHandler`) catches all errors and:
   - For known errors (AppError): Returns the error with its status code
   - For unknown errors: Wraps them as INTERNAL_SERVER_ERROR
3. All API responses containing errors follow the `ErrorResponse` interface:
   ```typescript
   {
     error: AppError;
   }
   ```

## Best Practices

1. Always use predefined error codes instead of creating custom ones
2. Include relevant metadata to provide context for error resolution
3. Use the `throwError` utility for consistent error throwing
4. Handle errors at the appropriate level - don't catch errors unnecessarily
5. Log errors appropriately using the error logging utilities
