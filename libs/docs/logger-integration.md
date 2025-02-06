# Logger Integration Guide for Libraries

## Overview
This guide explains how to integrate the logger library into other libraries under the `libs` folder. The logger follows functional programming principles, avoiding classes and mutable state.

## Integration Steps

### 1. Add Logger as a Dependency
In your library's `package.json`:
```json
{
  "dependencies": {
    "@eduplan/logger": "workspace:*"
  }
}
```

### 2. Create Module Logger
```typescript
// logger.ts
import { createLogger } from '@eduplan/logger';
import type { Logger, LogContext } from '@eduplan/logger';

// Create a single logger instance for the module
export const logger = createLogger({
  service: 'your-library-name'
});

// Export types for consumers
export type { Logger, LogContext };
```

### 3. Using the Logger

#### Function-Level Logging
```typescript
import { logger } from './logger';
import type { TaskEither } from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';

export const processData = async (data: ProcessData): Promise<Result> => {
  const operationLogger = logger.child({ 
    operation: 'processData',
    dataId: data.id 
  });

  operationLogger.info('Starting data processing');
  
  try {
    const result = await performProcessing(data);
    operationLogger.info('Processing completed', { result });
    return result;
  } catch (error) {
    operationLogger.error('Processing failed', { error });
    throw error;
  }
};

// Using with FP-TS
export const processDataFP = (
  data: ProcessData
): TaskEither<Error, Result> => {
  const operationLogger = logger.child({ 
    operation: 'processData',
    dataId: data.id 
  });

  return pipe(
    TE.tryCatch(
      () => performProcessing(data),
      (error) => error as Error
    ),
    TE.tap(() => 
      TE.right(operationLogger.info('Processing completed'))
    ),
    TE.mapLeft((error) => {
      operationLogger.error('Processing failed', { error });
      return error;
    })
  );
};
```

#### Context Propagation
```typescript
import { Logger } from '@eduplan/logger';

export interface OperationContext {
  logger?: Logger;
  // other context properties
}

export const libraryFunction = (context: OperationContext) => {
  const fnLogger = context.logger?.child({ 
    function: 'libraryFunction' 
  }) || logger;

  return pipe(
    performOperation(),
    TE.tap(() => TE.right(fnLogger.info('Operation succeeded'))),
    TE.mapLeft((error) => {
      fnLogger.error('Operation failed', { error });
      return error;
    })
  );
};
```

## Best Practices

### 1. Logger Organization
- Create a single logger instance per module
- Export logger types for consumers
- Use child loggers for operation-specific context

### 2. Context Management
- Accept logger instances in operation contexts
- Create new logger instances with operation-specific context
- Use consistent context field names

### 3. Error Handling
- Use FP-TS TaskEither for error handling
- Log errors with full context
- Propagate errors after logging

### 4. Type Safety
- Use TypeScript types for all logging contexts
- Export necessary types for consumers
- Follow the logger's type system

### 5. Performance
- Reuse logger instances
- Create child loggers efficiently
- Check log levels before expensive operations

## Available Context Types
The logger provides several context types for different use cases:

```typescript
type ServiceContext = 'api' | 'database' | 'cache' | 'queue' | 'auth' | 'file' | 'integration';

interface OperationContext extends BaseContext {
  operation: string;
  duration?: number;
  result: 'success' | 'failure';
}

interface ErrorContext extends BaseContext {
  code: ErrorCode;
  message: string;
  statusCode: number;
  metadata?: ErrorMetadata;
  stack?: string;
}
```

For a complete list of available types and functions, refer to the [Logger Implementation Documentation](../../logger/docs/logger-implementation.md).

## Related Documentation
- [Logger Implementation Details](../../logger/docs/logger-implementation.md)
- [Microservices Usage Guide](../../apps/docs/logger-usage.md)
