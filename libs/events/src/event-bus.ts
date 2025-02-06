import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import amqp, { Channel, Connection } from 'amqplib';
import Redis from 'ioredis';
import { Logger, Event, EventBusConfig, EventHandler, PublishOptions, SubscribeOptions } from '@eduflow/types';
import { EventBusInternalState } from './internal-types';

// Initialize RabbitMQ connection
const initializeRabbitMQ = (
  config: EventBusConfig,
  logger: Logger
): TE.TaskEither<Error, { connection: Connection; channel: Channel }> =>
  pipe(
    TE.tryCatch(
      () => amqp.connect(config.rabbitmq.url),
      E.toError
    ),
    TE.chain(connection =>
      pipe(
        TE.tryCatch(
          () => connection.createChannel(),
          E.toError
        ),
        TE.map(channel => ({ connection, channel }))
      )
    ),
    TE.chain(({ connection, channel }) =>
      pipe(
        TE.tryCatch(
          async () => {
            await channel.assertExchange(config.rabbitmq.exchange, 'topic', { durable: true });
            await channel.assertExchange(config.rabbitmq.deadLetterExchange, 'topic', { durable: true });
            return { connection, channel };
          },
          E.toError
        )
      )
    )
  );

// Initialize Redis connection (for caching only)
const initializeRedis = (
  config: EventBusConfig
): TE.TaskEither<Error, Redis> =>
  TE.tryCatch(
    () => {
      const client = new Redis(config.redis.url);
      return Promise.resolve(client);
    },
    E.toError
  );

// Redis cache operations
const cacheLastKnownEvent = (
  redis: Redis,
  keyPrefix: string,
  eventTTL: number
) => <T>(
  event: Event<T>
): TE.TaskEither<Error, void> =>
  TE.tryCatch(
    async () => {
      const key = `${keyPrefix}:last:${String(event.type)}`;
      await redis.set(
        key,
        JSON.stringify(event),
        'EX',
        eventTTL
      );
    },
    E.toError
  );

const getLastKnownEvent = (redis: Redis, keyPrefix: string) => <T>(
  eventType: string
): TE.TaskEither<Error, O.Option<Event<T>>> =>
  pipe(
    TE.tryCatch(
      async () => {
        const key = `${keyPrefix}:last:${eventType}`;
        const cached = await redis.get(key);
        return cached ? O.some(JSON.parse(cached)) : O.none;
      },
      E.toError
    )
  );

// Event publishing
const publishToRabbitMQ = (
  channel: Channel,
  exchange: string,
  event: Event<unknown>,
  options: { persistent: boolean; priority?: number }
): TE.TaskEither<Error, void> =>
  TE.tryCatch(
    async () => {
      await channel.publish(
        exchange,
        String(event.type),
        Buffer.from(JSON.stringify(event)),
        {
          persistent: options.persistent,
          priority: options.priority,
          headers: {
            'x-event-version': event.metadata.version,
            'x-event-source': event.metadata.source,
            'x-correlation-id': event.metadata.correlationId
          }
        }
      );
    },
    E.toError
  );

// Queue setup for subscribers
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
        deadLetterExchange
      });

      await channel.bindQueue(queueName, exchange, eventType);
      return queueName;
    },
    E.toError
  );

// State management
export const createEventBusState = (
  config: EventBusConfig,
  logger: Logger
): EventBusInternalState => ({
  rabbitmqChannel: null,
  rabbitmqConnection: null,
  redisClient: null,
  config,
  logger,
  handlers: new Map()
});

// Initialize connections
export const initialize = (
  state: EventBusInternalState
): TE.TaskEither<Error, EventBusInternalState> =>
  pipe(
    initializeRabbitMQ(state.config, state.logger),
    TE.chain(({ connection, channel }) =>
      pipe(
        initializeRedis(state.config),
        TE.map(redis => ({
          ...state,
          rabbitmqConnection: connection,
          rabbitmqChannel: channel,
          redisClient: redis
        }))
      )
    )
  );

// Publishing events
export const publish = (state: EventBusInternalState) => <T>(
  event: Event<T>,
  options: PublishOptions = {}
): TE.TaskEither<Error, void> => {
  const { persistent = true, cache = true, priority } = options;
  const enhancedEvent: Event<T> = {
    ...event,
    metadata: {
      ...event.metadata,
      source: state.config.serviceName,
      timestamp: new Date().toISOString()
    }
  };

  return pipe(
    // Always publish to RabbitMQ first
    state.rabbitmqChannel
      ? publishToRabbitMQ(
          state.rabbitmqChannel,
          state.config.rabbitmq.exchange,
          enhancedEvent,
          { persistent, priority }
        )
      : TE.left(new Error('RabbitMQ not initialized')),
    // Then optionally cache last known state
    TE.chain(() =>
      cache && state.redisClient
        ? cacheLastKnownEvent(
            state.redisClient,
            state.config.redis.keyPrefix,
            state.config.redis.eventTTL
          )(enhancedEvent)
        : TE.right(undefined)
    )
  );
};

// Subscribing to events
export const subscribe = (state: EventBusInternalState) => <T>(
  eventType: string,
  handler: EventHandler<T>,
  options: SubscribeOptions = {}
): TE.TaskEither<Error, void> => {
  if (!state.rabbitmqChannel) {
    return TE.left(new Error('RabbitMQ not initialized'));
  }

  return pipe(
    setupEventQueue(
      state.rabbitmqChannel,
      state.config.rabbitmq.exchange,
      state.config.rabbitmq.deadLetterExchange,
      eventType,
      options
    ),
    TE.chain(queueName =>
      TE.tryCatch(
        async () => {
          await state.rabbitmqChannel!.consume(queueName, async (msg) => {
            if (!msg) return;

            try {
              const event: Event<T> = JSON.parse(msg.content.toString());

              // Check last known state from Redis if enabled
              if (options.useCache && state.redisClient) {
                const lastKnownResult = await pipe(
                  getLastKnownEvent(state.redisClient, state.config.redis.keyPrefix)(String(event.type)),
                  TE.map(O.chain(cached => O.some(cached as Event<T>)))
                )();

                if (E.isRight(lastKnownResult) && O.isSome(lastKnownResult.right)) {
                  const lastKnown = lastKnownResult.right.value;
                  // Only use cache if it's newer than the message
                  if (new Date(lastKnown.metadata.timestamp) > new Date(event.metadata.timestamp)) {
                    await handler(lastKnown);
                    state.rabbitmqChannel?.ack(msg);
                    return;
                  }
                }
              }

              await handler(event);
              state.rabbitmqChannel?.ack(msg);

              // Update last known state in Redis
              if (state.redisClient) {
                await cacheLastKnownEvent(
                  state.redisClient,
                  state.config.redis.keyPrefix,
                  state.config.redis.eventTTL
                )(event)();
              }
            } catch (error) {
              const errorContext = {
                error: error instanceof Error ? error.message : String(error),
                eventType,
                retryCount: (msg.properties?.headers?.['x-retry-count'] ?? 0) + 1,
                timestamp: new Date().toISOString(),
                correlationId: msg.properties?.headers?.['x-correlation-id'],
                source: msg.properties?.headers?.['x-event-source']
              };
              
              state.logger.error('Error processing event', errorContext);
              
              if (errorContext.retryCount <= state.config.rabbitmq.retryCount) {
                setTimeout(() => {
                  // Add error context to message headers for retry
                  const headers = {
                    ...msg.properties.headers,
                    'x-retry-count': errorContext.retryCount,
                    'x-last-error': errorContext.error,
                    'x-last-retry': errorContext.timestamp
                  };
                  
                  state.rabbitmqChannel?.reject(msg, false);
                }, state.config.rabbitmq.retryDelay * errorContext.retryCount);
              } else {
                // When moving to DLQ, include full error context
                const deadLetterMsg = {
                  ...JSON.parse(msg.content.toString()),
                  error: errorContext
                };
                
                // Publish to dead letter exchange with error context
                state.rabbitmqChannel?.publish(
                  state.config.rabbitmq.deadLetterExchange,
                  `${eventType}.dead`,
                  Buffer.from(JSON.stringify(deadLetterMsg)),
                  {
                    persistent: true,
                    headers: {
                      'x-error': errorContext.error,
                      'x-failed-at': errorContext.timestamp,
                      'x-retry-count': errorContext.retryCount,
                      'x-correlation-id': errorContext.correlationId,
                      'x-source': errorContext.source
                    }
                  }
                );
                
                state.rabbitmqChannel?.ack(msg); // Ack the original message
              }
            }
          });
        },
        E.toError
      )
    )
  );
};

// Unsubscribe from events
export const unsubscribe = (state: EventBusInternalState) => (
  eventType: string
): TE.TaskEither<Error, void> => {
  if (!state.rabbitmqChannel) {
    return TE.left(new Error('RabbitMQ not initialized'));
  }

  return TE.tryCatch(
    async () => {
      const queueName = `queue.${eventType}`;
      await state.rabbitmqChannel!.unbindQueue(queueName, state.config.rabbitmq.exchange, eventType);
      await state.rabbitmqChannel!.deleteQueue(queueName);
      state.handlers.delete(eventType);
    },
    E.toError
  );
};

// Cleanup
export const close = (state: EventBusInternalState): TE.TaskEither<Error, void> =>
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
      E.toError
    )
  ); 