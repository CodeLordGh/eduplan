# Logging System Documentation

## Overview

The EduPlan logging system provides a comprehensive, type-safe logging infrastructure built on top of Pino logger. It offers structured logging with various specialized loggers for different aspects of the application.

## Core Components

### Log Levels

The system supports standard log levels in order of severity:

- **TRACE**: Detailed debugging information
- **DEBUG**: Debugging information
- **INFO**: General information about system operation
- **WARN**: Warning messages for potentially harmful situations
- **ERROR**: Error events that might still allow the application to continue running
- **FATAL**: Very severe error events that will presumably lead to application termination

### Context Types

#### Base Context

All log contexts extend from the base context which includes:

```typescript
{
  correlationId?: string;
  requestId?: string;
  timestamp?: Date;
  // Additional metadata
  [key: string]: unknown;
}
```

#### Request Context

For HTTP request logging:

```typescript
{
  path: string;
  method: string;
  userAgent?: string;
  ip?: string;
  userId?: string;
  sessionId?: string;
}
```

#### Error Context

For error logging:

```typescript
{
  code: ErrorCode;
  message: string;
  statusCode: number;
  metadata?: ErrorMetadata;
  stack?: string;
}
```

#### Operation Context

For tracking operations:

```typescript
{
  operation: string;
  duration?: number;
  result: 'success' | 'failure';
}
```

### Service Contexts

The system recognizes different service contexts:

- `api`: API service logs
- `database`: Database operation logs
- `cache`: Cache operation logs
- `queue`: Queue processing logs
- `auth`: Authentication logs
- `file`: File operation logs
- `integration`: Third-party integration logs

## Security Features

### Automatic Redaction

The logger automatically redacts sensitive information from logs:

- Authorization headers
- Passwords
- Tokens
- Secrets
- Keys

### Environment-Specific Behavior

The logger adjusts its behavior based on the environment:

- Development: More verbose logging
- Production: Optimized for performance
- Testing: Configurable for test requirements

## Best Practices

### 1. Structured Logging

Always use structured logging with appropriate context:

```typescript
logger.info('User action completed', {
  userId: '123',
  action: 'profile_update',
  duration: 150,
});
```

### 2. Error Logging

Use the error logger with full context:

```typescript
errorLogger.logError(error, {
  userId: user.id,
  operation: 'user_registration',
});
```

### 3. Request Logging

Utilize request logger middleware for HTTP requests:

```typescript
app.use(requestLogger);
```

### 4. Context Propagation

Always propagate correlation IDs through the system:

```typescript
logger.child({ correlationId: request.id });
```

### 5. Log Levels

Use appropriate log levels:

- TRACE/DEBUG: Development/debugging information
- INFO: Normal operations
- WARN: Potential issues
- ERROR: Actual errors
- FATAL: System-breaking errors

## Performance Considerations

1. Use child loggers for adding context
2. Avoid expensive computations in log messages
3. Use appropriate log levels to control output
4. Consider log sampling in high-traffic scenarios
5. Utilize asynchronous logging when appropriate
