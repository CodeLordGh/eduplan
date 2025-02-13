# Events Usage Guide for Microservices

## Overview

This guide explains how to use the event system in microservices under the `apps` folder. The system provides a functional approach to event-driven communication between services.

## Setup

### 1. Install Dependencies

```json
{
  "dependencies": {
    "@eduflow/common": "workspace:*",
    "@eduflow/types": "workspace:*",
    "@eduflow/events": "workspace:*",
    "fp-ts": "^2.16.0"
  }
}
```

### 2. Initialize Event Bus

```typescript
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { createEventBus, EventBusConfig, EventBusOperations } from '@eduflow/events';
import { logger } from '@eduflow/common';

const initializeService = (serviceName: string): TE.TaskEither<Error, EventBusOperations> =>
  pipe(
    createEventBus({
      serviceName,
      rabbitmq: {
        url: process.env.RABBITMQ_URL,
        exchange: 'eduflow.events',
      },
      redis: {
        url: process.env.REDIS_URL,
      },
    }),
    TE.tap(() => TE.right(logger.info('Service initialized', { serviceName })))
  );
```

## Usage Patterns

### 1. Publishing Events

```typescript
const publishUserCreated = (
  eventBus: EventBusOperations,
  userId: string,
  email: string,
  role: Role
): TE.TaskEither<Error, void> =>
  pipe(
    TE.tryCatch(
      () =>
        eventBus.publish('USER_CREATED', {
          id: userId,
          email,
          role,
        }),
      (error) => new Error(`Failed to publish user created event: ${error}`)
    ),
    TE.tap(() => TE.right(logger.info('User created event published', { userId })))
  );

// Usage in API route
app.post('/users', async (request, reply) =>
  pipe(
    createUser(request.body),
    TE.chain((user) => publishUserCreated(eventBus, user.id, user.email, user.role)),
    TE.fold(
      (error) => {
        logger.error('Failed to create user', { error });
        return reply.status(500).send(error);
      },
      () => reply.status(201).send()
    )
  )()
);
```

### 2. Subscribing to Events

```typescript
const setupKYCVerificationHandler = (eventBus: EventBusOperations): TE.TaskEither<Error, void> =>
  pipe(
    eventBus.subscribe<KYCVerifiedEvent['data']>(
      'KYC_VERIFIED',
      (event) =>
        pipe(
          validateKYCData(event.data),
          TE.chain(updateUserKYCStatus),
          TE.mapLeft((error) => {
            logger.error('KYC verification failed', {
              userId: event.data.userId,
              error,
            });
            return error;
          })
        ),
      {
        useCache: true,
        durable: true,
      }
    ),
    TE.tap(() => TE.right(logger.info('KYC verification handler setup')))
  );
```

### 3. Event-Driven Workflows

```typescript
const setupEnrollmentWorkflow = (eventBus: EventBusOperations): TE.TaskEither<Error, void> =>
  pipe(
    TE.Do,
    TE.chain(() => setupPaymentVerification(eventBus)),
    TE.chain(() => setupDocumentVerification(eventBus)),
    TE.chain(() => setupCourseAssignment(eventBus)),
    TE.chain(() => setupWelcomeEmailTrigger(eventBus)),
    TE.tap(() => TE.right(logger.info('Enrollment workflow setup complete')))
  );

const setupPaymentVerification = (eventBus: EventBusOperations): TE.TaskEither<Error, void> =>
  pipe(
    eventBus.subscribe<PaymentVerifiedEvent['data']>('PAYMENT_VERIFIED', (event) =>
      pipe(
        verifyPayment(event.data),
        TE.chain(updateEnrollmentStatus),
        TE.chain(() => triggerDocumentVerification(event.data.userId))
      )
    )
  );
```

### 4. Error Handling

```typescript
const withErrorHandling = <T>(
  operation: () => TE.TaskEither<Error, T>,
  context: { userId: string; eventType: string }
): TE.TaskEither<Error, T> =>
  pipe(
    operation(),
    TE.mapLeft((error) => {
      logger.error('Event processing failed', {
        ...context,
        error: error.message,
      });

      if (isRetryableError(error)) {
        return new RetryableError(error.message);
      }

      return error;
    })
  );

// Usage
const handleGradeUpdate = (event: Event<GradeUpdateEvent['data']>): TE.TaskEither<Error, void> =>
  pipe(
    () => updateStudentGrade(event.data),
    withErrorHandling({
      userId: event.data.studentId,
      eventType: event.type,
    })
  );
```

## Performance Optimization

### 1. Event Batching

```typescript
const processBatchedEvents = <T>(
  events: Array<Event<T>>,
  processor: (event: Event<T>) => TE.TaskEither<Error, void>
): TE.TaskEither<Error, void> =>
  pipe(
    events,
    TE.traverseArray((event) =>
      pipe(
        processor(event),
        TE.mapLeft((error) => {
          logger.error('Batch processing failed', {
            eventId: event.id,
            error: error.message,
          });
          return error;
        })
      )
    ),
    TE.map(() => undefined)
  );
```

### 2. Caching Strategy

```typescript
const withCache = <T>(eventBus: EventBusOperations, event: Event<T>): TE.TaskEither<Error, void> =>
  pipe(
    TE.tryCatch(
      async () => {
        const cacheKey = `event:${event.id}`;
        const cached = await eventBus.checkCache(cacheKey);

        if (cached) {
          logger.info('Event already processed', {
            eventId: event.id,
          });
          return;
        }

        await processEvent(event);
        await eventBus.setCache(cacheKey, 'processed', 3600);
      },
      (error) => new Error(`Cache operation failed: ${error}`)
    )
  );
```

## Monitoring and Debugging

### 1. Event Logging

```typescript
const withEventLogging = <T>(
  event: Event<T>,
  processor: (event: Event<T>) => TE.TaskEither<Error, void>
): TE.TaskEither<Error, void> =>
  pipe(
    TE.Do,
    TE.tap(() =>
      TE.right(
        logger.info('Processing event', {
          type: event.type,
          id: event.id,
          timestamp: event.timestamp,
        })
      )
    ),
    TE.chain(() => processor(event)),
    TE.tap(() =>
      TE.right(
        logger.info('Event processed', {
          type: event.type,
          id: event.id,
        })
      )
    ),
    TE.mapLeft((error) => {
      logger.error('Event processing failed', {
        type: event.type,
        id: event.id,
        error: error.message,
      });
      return error;
    })
  );
```

### 2. Health Checks

```typescript
const monitorEventSystem = (eventBus: EventBusOperations): TE.TaskEither<Error, void> =>
  pipe(
    TE.tryCatch(
      async () => {
        setInterval(async () => {
          const health = await eventBus.checkHealth();
          logger.info('Event system health', health);

          if (health.status === 'unhealthy') {
            logger.error('Event system unhealthy', health.details);
          }
        }, 60000);
      },
      (error) => new Error(`Health check failed: ${error}`)
    )
  );
```

## Testing Events

### 1. Event Mocking

```typescript
const createTestEvent = <T>(type: string, data: T): Event<T> => ({
  id: 'test-id',
  type,
  timestamp: new Date().toISOString(),
  source: 'test',
  data,
});

const mockEventBus = (): EventBusOperations => ({
  publish: jest.fn().mockReturnValue(TE.right(undefined)),
  subscribe: jest.fn().mockReturnValue(TE.right(undefined)),
  unsubscribe: jest.fn().mockReturnValue(TE.right(undefined)),
  close: jest.fn().mockResolvedValue(undefined),
});
```

### 2. Event Testing

```typescript
describe('Grade Update Flow', () => {
  const eventBus = mockEventBus();

  it('should process grade updates', async () => {
    const event = createTestEvent('GRADE_UPDATED', {
      studentId: 'student-1',
      courseId: 'course-1',
      grade: 95,
    });

    await pipe(
      handleGradeUpdate(event),
      TE.fold(
        (error) => {
          fail(`Should not fail: ${error.message}`);
          return TE.right(undefined);
        },
        () => {
          expect(eventBus.publish).toHaveBeenCalledWith('GRADE_NOTIFICATION', expect.any(Object));
          return TE.right(undefined);
        }
      )
    )();
  });
});
```

## Related Documentation

### Core Implementation

- [Events Implementation](../../libs/common/docs/events.md)
- [Error Handling Implementation](../../libs/common/docs/error-handling.md)
- [Logger Implementation](../../libs/logger/docs/logger-implementation.md)

### Integration Guides

- [Events Integration Guide](../../libs/docs/events-integration.md)
- [Error Handling Integration](../../libs/docs/error-handling-integration.md)
- [Logger Integration](../../libs/docs/logger-integration.md)

### Additional Resources

- [System Integration](./system-integration.md)
