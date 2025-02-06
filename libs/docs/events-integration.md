# Events Integration Guide

## Overview
This guide explains how to integrate the event system into libraries and services. The system provides a functional, type-safe approach to event-driven architecture using fp-ts.

## Integration Steps

### 1. Add Dependencies
```json
{
  "dependencies": {
    "@eduflow/common": "workspace:*",
    "@eduflow/types": "workspace:*",
    "@eduflow/events": "workspace:*",
    "fp-ts": "^2.16.0",
    "redis": "^4.0.0",
    "amqplib": "^0.10.0"
  }
}
```

### 2. Import Required Modules
```typescript
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';
import { 
  createEventBus,
  EventBusConfig,
  EventBusOperations,
  Event
} from '@eduflow/events';
import { logger } from '@eduflow/common';
```

## Event Bus Setup

### 1. Configuration
```typescript
const createEventBusConfig = (
  serviceName: string
): EventBusConfig => ({
  serviceName,
  rabbitmq: {
    url: process.env.RABBITMQ_URL,
    exchange: 'eduflow.events',
    deadLetterExchange: 'eduflow.events.dlq'
  },
  redis: {
    url: process.env.REDIS_URL,
    prefix: 'eduflow:events'
  }
});
```

### 2. Initialization
```typescript
const initializeEventBus = (
  config: EventBusConfig
): TE.TaskEither<Error, EventBusOperations> =>
  pipe(
    createEventBus(config),
    TE.map(eventBus => {
      logger.info('Event bus initialized', {
        service: config.serviceName
      });
      return eventBus;
    })
  );
```

## Event Publishing

### 1. Event Creation
```typescript
const createEvent = <T>(
  type: string,
  data: T,
  source: string
): Event<T> => ({
  id: crypto.randomUUID(),
  type,
  timestamp: new Date().toISOString(),
  source,
  data
});
```

### 2. Publishing Events
```typescript
const publishEvent = <T>(
  eventBus: EventBusOperations,
  type: string,
  data: T,
  options?: PublishOptions
): TE.TaskEither<Error, void> =>
  pipe(
    TE.tryCatch(
      () => eventBus.publish(type, data, options),
      error => new Error(`Failed to publish event: ${error}`)
    ),
    TE.tap(() => TE.right(
      logger.info('Event published', {
        type,
        id: data.id
      })
    ))
  );
```

## Event Subscription

### 1. Event Handler Setup
```typescript
const createEventHandler = <T>(
  processor: (data: T) => TE.TaskEither<Error, void>
) => (
  event: Event<T>
): TE.TaskEither<Error, void> =>
  pipe(
    TE.Do,
    TE.chain(() => processor(event.data)),
    TE.mapLeft(error => {
      logger.error('Event processing failed', {
        type: event.type,
        id: event.id,
        error: error.message
      });
      return error;
    })
  );
```

### 2. Subscription Setup
```typescript
const setupSubscription = <T>(
  eventBus: EventBusOperations,
  type: string,
  handler: (event: Event<T>) => TE.TaskEither<Error, void>,
  options?: SubscribeOptions
): TE.TaskEither<Error, void> =>
  pipe(
    eventBus.subscribe(type, handler, options),
    TE.tap(() => TE.right(
      logger.info('Event subscription setup', {
        type,
        options
      })
    ))
  );
```

## Error Handling

### 1. Event Processing Errors
```typescript
const handleEventError = (
  error: unknown,
  event: Event<unknown>
): TE.TaskEither<Error, void> =>
  pipe(
    TE.tryCatch(
      async () => {
        logger.error('Event processing error', {
          type: event.type,
          id: event.id,
          error: error instanceof Error ? error.message : String(error)
        });
        
        // Move to DLQ if needed
        if (shouldMoveToDLQ(error)) {
          await moveToDeadLetterQueue(event);
        }
      },
      error => new Error(`Error handling failed: ${error}`)
    )
  );
```

### 2. Retry Mechanism
```typescript
const withRetry = <T>(
  operation: () => TE.TaskEither<Error, T>,
  retryCount: number = 3,
  delay: number = 1000
): TE.TaskEither<Error, T> => {
  const retry = (
    remainingAttempts: number,
    lastError: Error
  ): TE.TaskEither<Error, T> =>
    remainingAttempts <= 0
      ? TE.left(lastError)
      : pipe(
          TE.tryCatch(
            () => new Promise(resolve => setTimeout(resolve, delay)),
            error => error as Error
          ),
          TE.chain(() => operation()),
          TE.orElse(error =>
            retry(remainingAttempts - 1, error as Error)
          )
        );

  return pipe(
    operation(),
    TE.orElse(error => retry(retryCount - 1, error as Error))
  );
};
```

## Monitoring and Health Checks

### 1. Health Check Setup
```typescript
const setupHealthCheck = (
  eventBus: EventBusOperations
): TE.TaskEither<Error, void> =>
  pipe(
    TE.tryCatch(
      async () => {
        const status = await checkHealth(eventBus);
        logger.info('Event system health', status);
      },
      error => new Error(`Health check failed: ${error}`)
    )
  );
```

### 2. Metrics Collection
```typescript
const setupMetricsCollection = (
  service: string
): TE.TaskEither<Error, void> =>
  pipe(
    TE.tryCatch(
      async () => {
        setInterval(() => {
          const metrics = getMetricsSummary();
          logger.info('Event metrics', {
            service,
            ...metrics
          });
        }, 60000);
      },
      error => new Error(`Metrics collection failed: ${error}`)
    )
  );
```

## Testing Integration

### 1. Mock Event Bus
```typescript
const createMockEventBus = (): EventBusOperations => ({
  publish: jest.fn().mockReturnValue(TE.right(undefined)),
  subscribe: jest.fn().mockReturnValue(TE.right(undefined)),
  unsubscribe: jest.fn().mockReturnValue(TE.right(undefined)),
  close: jest.fn().mockResolvedValue(undefined)
});
```

### 2. Event Testing
```typescript
describe('Event Integration', () => {
  const mockEventBus = createMockEventBus();
  
  it('should publish events', async () => {
    const event = createEvent('TEST_EVENT', { data: 'test' }, 'test-service');
    
    await pipe(
      publishEvent(mockEventBus, event.type, event.data),
      TE.fold(
        error => {
          fail(`Should not fail: ${error.message}`);
          return TE.right(undefined);
        },
        () => TE.right(undefined)
      )
    )();
    
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      event.type,
      event.data,
      undefined
    );
  });
});
```

## Best Practices

### 1. Event Schema Management
```typescript
import { z } from 'zod';

const eventSchemas = {
  USER_CREATED: z.object({
    id: z.string(),
    email: z.string().email(),
    role: z.enum(['STUDENT', 'TEACHER', 'ADMIN'])
  }),
  
  GRADE_UPDATED: z.object({
    studentId: z.string(),
    courseId: z.string(),
    grade: z.number().min(0).max(100)
  })
} as const;

type EventSchemas = typeof eventSchemas;
type EventTypes = keyof EventSchemas;
type EventData<T extends EventTypes> = z.infer<EventSchemas[T]>;
```

### 2. Error Categories
```typescript
const EventErrorTypes = {
  VALIDATION_ERROR: 'EVENT_VALIDATION_ERROR',
  PROCESSING_ERROR: 'EVENT_PROCESSING_ERROR',
  PUBLISH_ERROR: 'EVENT_PUBLISH_ERROR',
  SUBSCRIPTION_ERROR: 'EVENT_SUBSCRIPTION_ERROR'
} as const;

type EventErrorType = typeof EventErrorTypes[keyof typeof EventErrorTypes];
```

## Related Documentation

### Core Implementation
- [Events Implementation](../common/docs/events.md)
- [Error Handling Implementation](../common/docs/error-handling.md)
- [Logger Implementation](../logger/docs/logger-implementation.md)

### Usage Guides
- [Events Usage Guide](../../apps/docs/events-usage.md)
- [Error Handling Usage](../../apps/docs/error-handling-usage.md)
- [Logger Usage](../../apps/docs/logger-usage.md)

### Additional Resources
- [System Integration](../../apps/docs/system-integration.md)
