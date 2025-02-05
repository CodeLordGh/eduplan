import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as R from 'fp-ts/Record';
import amqp, { Channel, Connection } from 'amqplib';
import Redis from 'ioredis';
import { Logger } from '@eduflow/logger';
import { Event, EventBusConfig, EventHandler, PublishOptions, SubscribeOptions } from './types';

// Core types
type EventBusState = {
  rabbitmqChannel: Channel | null;
  rabbitmqConnection: Connection | null;
  redisClient: Redis | null;
  config: EventBusConfig;
  logger: Logger;
  handlers: Map<string, EventHandler>;
};

// Initialize connections
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

// Event subscription
const setupEventQueue = (
  channel: Channel,
  exchange: string,
  deadLetterExchange: string,
  eventType: string,
  options: SubscribeOptions
): TE.TaskEither<Error, string> =>
  TE.tryCatch(
    async () => {
      const queueName = options.queue || `queue.${eventType}`;
      await channel.assertQueue(queueName, {
        exclusive: options.exclusive,
        durable: options.durable,
        deadLetterExchange,
        arguments: {
          'x-dead-letter-routing-key': `${eventType}.dead`,
          'x-message-ttl': 1000 * 60 * 60 * 24, // 24 hours
          'x-max-priority': 10
        }
      });
      await channel.bindQueue(queueName, exchange, options.pattern || eventType);
      return queueName;
    },
    E.toError
  );

// Public API
export const createEventBusState = (
  config: EventBusConfig,
  logger: Logger
): EventBusState => ({
  rabbitmqChannel: null,
  rabbitmqConnection: null,
  redisClient: null,
  config,
  logger,
  handlers: new Map()
});

export const initialize = (
  state: EventBusState
): TE.TaskEither<Error, EventBusState> =>
  pipe(
    TE.Do,
    TE.bind('rabbitmq', () => initializeRabbitMQ(state.config, state.logger)),
    TE.bind('redis', () => initializeRedis(state.config)),
    TE.map(({ rabbitmq, redis }) => ({
      ...state,
      rabbitmqChannel: rabbitmq.channel,
      rabbitmqConnection: rabbitmq.connection,
      redisClient: redis
    }))
  );

export const publish = (state: EventBusState) => <T>(
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

export const subscribe = (state: EventBusState) => <T>(
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
              state.logger.error('Error processing event', { error, eventType });
              
              const retryCount = (msg.properties?.headers?.['x-retry-count'] ?? 0) + 1;
              if (retryCount <= state.config.rabbitmq.retryCount) {
                setTimeout(() => {
                  state.rabbitmqChannel?.reject(msg, false);
                }, state.config.rabbitmq.retryDelay * retryCount);
              } else {
                state.rabbitmqChannel?.reject(msg, false);
              }
            }
          });
        },
        E.toError
      )
    )
  );
};

export const unsubscribe = (state: EventBusState) => (
  eventType: string
): TE.TaskEither<Error, void> =>
  TE.tryCatch(
    async () => {
      state.handlers.delete(eventType);
    },
    E.toError
  );

export const close = (state: EventBusState): TE.TaskEither<Error, void> =>
  pipe(
    TE.Do,
    TE.chain(() =>
      TE.tryCatch(
        async () => {
          await state.rabbitmqChannel?.close();
          await state.rabbitmqConnection?.close();
          await state.redisClient?.quit();
        },
        E.toError
      )
    )
  ); 