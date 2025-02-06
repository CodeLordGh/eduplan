# Events Integration Guide

## Overview
This guide focuses on integrating the event system into your libraries and services. For a complete understanding of the event system, please refer to the [Events Documentation](../events/docs/events.md).

## Quick Start

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
  EventBusOperations
} from '@eduflow/events';
import { logger } from '@eduflow/common';
```

## Integration Patterns

### 1. Basic Event Bus Setup
```typescript
const setupEventBus = (serviceName: string): TE.TaskEither<Error, EventBusOperations> =>
  pipe(
    createEventBus({
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
    }),
    TE.map(eventBus => {
      logger.info('Event bus initialized', { service: serviceName });
      return eventBus;
    })
  );
```

### 2. Event Publishing Pattern
```typescript
const publishWithRetry = <T>(
  eventBus: EventBusOperations,
  type: string,
  data: T
): TE.TaskEither<Error, void> =>
  pipe(
    TE.tryCatch(
      () => eventBus.publish(type, data),
      error => new Error(`Failed to publish event: ${error}`)
    ),
    TE.chain(result =>
      pipe(
        TE.right(logger.info('Event published', { type, data })),
        TE.map(() => result)
      )
    )
  );
```

### 3. Event Subscription Pattern
```typescript
const subscribeWithErrorHandling = <T>(
  eventBus: EventBusOperations,
  type: string,
  handler: (data: T) => Promise<void>
): TE.TaskEither<Error, void> =>
  pipe(
    eventBus.subscribe(
      type,
      async (event) => {
        try {
          await handler(event.data);
          logger.info('Event processed', { type, id: event.id });
        } catch (error) {
          logger.error('Event processing failed', {
            type,
            id: event.id,
            error: error instanceof Error ? error.message : String(error)
          });
          throw error;
        }
      }
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

### 2. Integration Tests
```typescript
describe('Event Integration', () => {
  const mockEventBus = createMockEventBus();
  
  it('should publish events', async () => {
    const data = { id: '123', type: 'TEST' };
    
    await pipe(
      publishWithRetry(mockEventBus, 'TEST_EVENT', data),
      TE.fold(
        error => {
          fail(`Should not fail: ${error.message}`);
          return TE.right(undefined);
        },
        () => {
          expect(mockEventBus.publish).toHaveBeenCalledWith(
            'TEST_EVENT',
            data
          );
          return TE.right(undefined);
        }
      )
    )();
  });
});
```

## Best Practices for Integration

### 1. Event Bus Lifecycle
- Initialize event bus at application startup
- Handle graceful shutdown
- Monitor connection health
- Use the resilience features from the main library

### 2. Error Handling
- Implement proper error handling for event processing
- Use dead letter queues for failed events
- Log errors with context
- Implement retry mechanisms for transient failures

### 3. Testing
- Use mock event bus for unit tests
- Test error scenarios
- Verify event handling logic
- Test retry mechanisms

### 4. Monitoring
- Implement health checks
- Monitor event processing metrics
- Track failed events
- Set up alerting for critical failures

## Related Documentation

### Core Documentation
- [Events Documentation](../events/docs/events.md) - Complete event system documentation
- [Event Types](../../types/docs/types.md#event-system-types) - Event type definitions
- [Error Handling](../common/docs/error-handling.md) - Error handling integration

### Implementation Details
- [Resilience Features](../events/docs/events.md#resilience-features) - Circuit breaker, connection pooling, etc.
- [Metrics and Monitoring](../events/docs/events.md#metrics-and-monitoring) - Metrics collection and monitoring
- [Health Monitoring](../events/docs/events.md#health-monitoring) - Health check implementation
