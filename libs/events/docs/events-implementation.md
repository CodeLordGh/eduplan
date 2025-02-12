# Event System Implementation

## Overview

The event system provides a robust, functional, and type-safe event-driven architecture using RabbitMQ and Redis. It follows functional programming principles using fp-ts and supports distributed event processing with caching, metrics, and health monitoring.

## Directory Structure

```
libs/events/
├── src/
│   ├── event-bus.ts      # Core event bus implementation
│   ├── factory.ts        # Event bus factory and operations
│   ├── types.ts          # Type definitions
│   ├── validation.ts     # Event validation
│   ├── metrics.ts        # Metrics collection
│   └── health.ts         # Health monitoring
└── docs/
    └── events-implementation.md  # This file
```

## Core Components

### Event Bus State

```typescript
interface EventBusState {
  rabbitmqChannel: Channel | null;
  rabbitmqConnection: Connection | null;
  redisClient: Redis | null;
  config: EventBusConfig;
  logger: Logger;
  handlers: Map<string, EventHandler>;
}

interface EventBusConfig {
  serviceName: string;
  rabbitmq: {
    url: string;
    exchange: string;
    deadLetterExchange?: string;
  };
  redis: {
    url: string;
    prefix?: string;
  };
}
```

### Event Bus Operations

```typescript
interface EventBusOperations {
  publish: <T>(type: string, data: T, options?: PublishOptions) => TE.TaskEither<Error, void>;

  subscribe: <T>(
    type: string,
    handler: (event: Event<T>) => Promise<void>,
    options?: SubscribeOptions
  ) => TE.TaskEither<Error, void>;

  unsubscribe: (type: string, options?: UnsubscribeOptions) => TE.TaskEither<Error, void>;

  close: () => Promise<void>;
}
```

## Initialization

### Event Bus Creation

```typescript
const createEventBus = (config: EventBusConfig): TE.TaskEither<Error, EventBusOperations> => {
  const logger = createLogger({
    service: config.serviceName,
    environment: process.env.NODE_ENV || 'development',
  });

  return pipe(
    createEventBusState(config, logger),
    initialize,
    TE.map((state) => ({
      publish: publish(state),
      subscribe: subscribe(state),
      unsubscribe: unsubscribe(state),
      close: () => close(state),
    }))
  );
};
```

### RabbitMQ Initialization

```typescript
const initializeRabbitMQ = (
  config: EventBusConfig,
  logger: Logger
): TE.TaskEither<Error, { connection: Connection; channel: Channel }> =>
  pipe(
    TE.tryCatch(
      async () => {
        const connection = await connect(config.rabbitmq.url);
        const channel = await connection.createChannel();

        await channel.assertExchange(config.rabbitmq.exchange, 'topic', { durable: true });

        if (config.rabbitmq.deadLetterExchange) {
          await channel.assertExchange(config.rabbitmq.deadLetterExchange, 'topic', {
            durable: true,
          });
        }

        logger.info('RabbitMQ initialized', {
          exchange: config.rabbitmq.exchange,
        });

        return { connection, channel };
      },
      (error) => new Error(`Failed to initialize RabbitMQ: ${error}`)
    )
  );
```

### Redis Initialization

```typescript
const initializeRedis = (config: EventBusConfig): TE.TaskEither<Error, Redis> =>
  pipe(
    TE.tryCatch(
      async () => {
        const client = new Redis(config.redis.url);
        await client.ping();
        return client;
      },
      (error) => new Error(`Failed to initialize Redis: ${error}`)
    )
  );
```

## Event Publishing

### Direct Publishing

```typescript
const publish =
  (state: EventBusState) =>
  <T>(type: string, data: T, options?: PublishOptions): TE.TaskEither<Error, void> =>
    pipe(
      validateEvent({ type, data, timestamp: new Date().toISOString() }),
      TE.chain((event) =>
        publishToRabbitMQ(state.rabbitmqChannel!, state.config.rabbitmq.exchange, event, {
          persistent: options?.persistent ?? true,
          priority: options?.priority,
        })
      )
    );
```

### RabbitMQ Publishing

```typescript
const publishToRabbitMQ = (
  channel: Channel,
  exchange: string,
  event: Event<unknown>,
  options: { persistent: boolean; priority?: number }
): TE.TaskEither<Error, void> =>
  pipe(
    TE.tryCatch(
      async () => {
        await channel.publish(exchange, event.type, Buffer.from(JSON.stringify(event)), {
          persistent: options.persistent,
          priority: options.priority,
        });
      },
      (error) => new Error(`Failed to publish to RabbitMQ: ${error}`)
    )
  );
```

## Event Subscription

### Queue Setup

```typescript
const setupEventQueue = (
  channel: Channel,
  exchange: string,
  deadLetterExchange: string,
  eventType: string,
  options: SubscribeOptions
): TE.TaskEither<Error, string> =>
  TE.tryCatch(
    async () => {
      const { queueName = `queue.${eventType}`, durable = true } = options;

      await channel.assertQueue(queueName, {
        durable,
        deadLetterExchange,
      });

      await channel.bindQueue(queueName, exchange, eventType);
      return queueName;
    },
    (error) => new Error(`Failed to setup queue: ${error}`)
  );
```

### Subscription Handler

```typescript
const subscribe =
  (state: EventBusState) =>
  <T>(
    type: string,
    handler: (event: Event<T>) => Promise<void>,
    options?: SubscribeOptions
  ): TE.TaskEither<Error, void> =>
    pipe(
      setupEventQueue(
        state.rabbitmqChannel!,
        state.config.rabbitmq.exchange,
        state.config.rabbitmq.deadLetterExchange!,
        type,
        options ?? {}
      ),
      TE.chain((queueName) =>
        TE.tryCatch(
          async () => {
            await state.rabbitmqChannel!.consume(
              queueName,
              async (msg) => {
                if (!msg) return;

                try {
                  const event = JSON.parse(msg.content.toString()) as Event<T>;

                  if (options?.useCache) {
                    const cached = await checkCache(state, event);
                    if (cached) {
                      state.rabbitmqChannel?.ack(msg);
                      return;
                    }
                  }

                  await handler(event);
                  state.rabbitmqChannel?.ack(msg);

                  if (options?.useCache) {
                    await cacheEvent(state, event);
                  }
                } catch (error) {
                  state.logger.error('Failed to process event', {
                    type,
                    error: error instanceof Error ? error.message : String(error),
                  });
                  state.rabbitmqChannel?.nack(msg, false, false);
                }
              },
              { noAck: false }
            );
          },
          (error) => new Error(`Failed to setup consumer: ${error}`)
        )
      )
    );
```

## Caching

### Last Known Event

```typescript
const getLastKnownEvent =
  (redis: Redis, keyPrefix: string) =>
  <T>(eventType: string): TE.TaskEither<Error, O.Option<Event<T>>> =>
    pipe(
      TE.tryCatch(
        async () => {
          const key = `${keyPrefix}:last:${eventType}`;
          const cached = await redis.get(key);
          return cached ? O.some(JSON.parse(cached)) : O.none;
        },
        (error) => new Error(`Failed to get last known event: ${error}`)
      )
    );
```

### Cache Management

```typescript
const cacheLastKnownEvent =
  (redis: Redis, keyPrefix: string, eventTTL: number) =>
  <T>(event: Event<T>): TE.TaskEither<Error, void> =>
    pipe(
      TE.tryCatch(
        async () => {
          const key = `${keyPrefix}:last:${event.type}`;
          await redis.set(key, JSON.stringify(event), 'EX', eventTTL);
        },
        (error) => new Error(`Failed to cache event: ${error}`)
      )
    );
```

## Cleanup

### Resource Cleanup

```typescript
const close = (state: EventBusState): TE.TaskEither<Error, void> =>
  pipe(
    TE.tryCatch(
      async () => {
        if (state.rabbitmqChannel) {
          await state.rabbitmqChannel.close();
        }
        if (state.rabbitmqConnection) {
          await state.rabbitmqConnection.close();
        }
        if (state.redisClient) {
          await state.redisClient.quit();
        }
      },
      (error) => new Error(`Failed to cleanup resources: ${error}`)
    )
  );
```

## Event Validation

### Schema Validation

```typescript
const validateEvent = <T>(event: Event<T>): TE.TaskEither<Error, Event<T>> =>
  pipe(
    TE.tryCatch(
      async () => {
        const baseResult = baseEventSchema.safeParse(event);
        if (!baseResult.success) {
          throw new Error(`Invalid event: ${baseResult.error.message}`);
        }

        const schema = eventSchemas[event.type];
        if (schema) {
          const dataResult = schema.safeParse(event.data);
          if (!dataResult.success) {
            throw new Error(`Invalid data for ${event.type}: ${dataResult.error.message}`);
          }
        }

        return event;
      },
      (error) => (error instanceof Error ? error : new Error(String(error)))
    )
  );
```

## Health Monitoring

### Health Check

```typescript
const checkHealth = (state: EventBusState): TE.TaskEither<Error, HealthStatus> =>
  pipe(
    TE.Do,
    TE.bind('rabbitmq', () =>
      checkRabbitMQ(state.rabbitmqChannel, state.rabbitmqConnection, state.config.rabbitmq.exchange)
    ),
    TE.bind('redis', () => checkRedis(state.redisClient)),
    TE.map(({ rabbitmq, redis }) => ({
      status: rabbitmq.connected && redis.connected ? 'healthy' : 'unhealthy',
      details: {
        rabbitmq,
        redis,
      },
      timestamp: new Date().toISOString(),
    }))
  );
```

## Related Documentation

### Integration Guides

- [Events Integration Guide](../../docs/events-integration.md)
- [Error Handling Integration](../../docs/error-handling-integration.md)
- [Logger Integration](../../docs/logger-integration.md)

### Usage Guides

- [Events Usage Guide](../../../apps/docs/events-usage.md)
- [Error Handling Usage](../../../apps/docs/error-handling-usage.md)
- [Logger Usage](../../../apps/docs/logger-usage.md)

### Additional Resources

- [System Integration](../../../apps/docs/system-integration.md)
