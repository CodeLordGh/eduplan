# Exports from libs/events

## index.ts

- Re-exports from various modules including `event-bus`, `factory`, `validation`, `metrics`, and `health`.
- `EVENT_TYPES`, `EventType` from `@eduflow/types`.

## factory.ts

- `createEventBus(config: EventBusConfig): TE.TaskEither<Error, EventBusOperations>`
  - Creates an event bus with operations like publish, subscribe, unsubscribe, and close.
  - Returns a TaskEither resolving to EventBusOperations or an Error.

## validation.ts

- `validateEvent<T extends EventType>(event: Event<unknown>): TE.TaskEither<Error, Event<EventDataMap[T]>>`
  - Validates an event against its schema.
  - Returns a TaskEither resolving to the validated event or an Error.

- Various type exports for event data and metadata.

## metrics.ts

- `recordProcessingTime(logger: Logger, eventType: string, service: string, startTime: number): void`
  - Records the processing time of an event.

- `incrementEventCounter(logger: Logger, eventType: string, service: string, status: 'success' | 'error'): void`
  - Increments the event counter based on the status.

- Other utility functions for updating metrics.

## event-bus.ts

- `publish<T>(state: EventBusInternalState, event: Event<T>, options: PublishOptions = {}): TE.TaskEither<Error, void>`
  - Publishes an event to RabbitMQ and optionally caches it.
  - Returns a TaskEither resolving to void or an Error.

- `subscribe<T>(state: EventBusInternalState, eventType: string, handler: EventHandler<T>, options: SubscribeOptions = {}): TE.TaskEither<Error, void>`
  - Subscribes to an event type with a handler.
  - Returns a TaskEither resolving to void or an Error.

- `unsubscribe(state: EventBusInternalState, eventType: string): TE.TaskEither<Error, void>`
  - Unsubscribes from an event type.
  - Returns a TaskEither resolving to void or an Error.

- `close(state: EventBusInternalState): TE.TaskEither<Error, void>`
  - Closes the event bus connections.
  - Returns a TaskEither resolving to void or an Error. 