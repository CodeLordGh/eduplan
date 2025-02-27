import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';
import amqp, { Channel, Connection } from 'amqplib';
import {
  Logger,
  Event,
  EventBusConfig,
  EventHandler,
  PublishOptions,
  SubscribeOptions,
  EventType
} from '@eduflow/types';
import { EventBusInternalState } from './internal-types';

// Initialize RabbitMQ connection
const initializeRabbitMQ = (
  config: EventBusConfig,
  _logger: Logger
): TE.TaskEither<Error, { connection: Connection; channel: Channel }> =>
  pipe(
    TE.tryCatch(() => amqp.connect(config.rabbitmq.url), E.toError),
    TE.chain((connection) =>
      pipe(
        TE.tryCatch(() => connection.createChannel(), E.toError),
        TE.map((channel) => ({ connection, channel }))
      )
    ),
    TE.chain(({ connection, channel }) =>
      pipe(
        TE.tryCatch(async () => {
          await channel.assertExchange(config.rabbitmq.exchange, 'topic', { durable: true });
          await channel.assertExchange(config.rabbitmq.deadLetterExchange, 'topic', {
            durable: true,
          });
          return { connection, channel };
        }, E.toError)
      )
    )
  );

// Event publishing
const publishToRabbitMQ = (
  channel: Channel,
  exchange: string,
  event: Event<unknown>,
  options: { persistent: boolean; priority?: number }
): TE.TaskEither<Error, void> =>
  TE.tryCatch(async () => {
    await channel.publish(exchange, String(event.type), Buffer.from(JSON.stringify(event)), {
      persistent: options.persistent,
      priority: options.priority,
      headers: {
        'x-event-version': event.metadata.version,
        'x-event-source': event.metadata.source,
        'x-correlation-id': event.metadata.correlationId,
      },
    });
  }, E.toError);

// Queue setup for subscribers
const setupEventQueue = (
  channel: Channel,
  exchange: string,
  deadLetterExchange: string,
  eventType: string,
  options: SubscribeOptions
): TE.TaskEither<Error, string> =>
  TE.tryCatch(async () => {
    const { queueName = `queue.${eventType}`, durable = true } = options;

    await channel.assertQueue(queueName, {
      durable,
      deadLetterExchange,
    });

    await channel.bindQueue(queueName, exchange, eventType);
    return queueName;
  }, E.toError);

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
  handlers: new Map(),
  consumerTags: new Map(),
});

// Initialize connections
export const initialize = (
  state: EventBusInternalState
): TE.TaskEither<Error, EventBusInternalState> =>
  pipe(
    initializeRabbitMQ(state.config, state.logger),
    TE.map(({ connection, channel }) => ({
      ...state,
      rabbitmqConnection: connection,
      rabbitmqChannel: channel,
    }))
  );

// Publishing events
export const publish =
  (state: EventBusInternalState) =>
  <T>(event: Event<T>, options: PublishOptions = {}): TE.TaskEither<Error, void> => {
    const { persistent = true, priority } = options;
    const enhancedEvent: Event<T> = {
      ...event,
      metadata: {
        ...event.metadata,
        source: state.config.serviceName,
        timestamp: new Date().toISOString(),
      },
    };

    return state.rabbitmqChannel
      ? publishToRabbitMQ(state.rabbitmqChannel, state.config.rabbitmq.exchange, enhancedEvent, {
          persistent,
          priority,
        })
      : TE.left(new Error('RabbitMQ not initialized'));
  };

// Subscribing to events
export const subscribe =
  (state: EventBusInternalState) =>
  <T>(
    eventType: EventType,
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
      TE.chain((queueName) =>
        TE.tryCatch(async () => {
          const { consumerTag } = await state.rabbitmqChannel!.consume(queueName, async (msg) => {
            if (!msg) return;

            try {
              const parsedEvent = JSON.parse(msg.content.toString());
              // Validate that the parsed event type exists in our EventType enum
              if (!(parsedEvent.type in EventType)) {
                throw new Error(`Invalid event type: ${parsedEvent.type}`);
              }
              // Cast to Event<T> after validation
              const event: Event<T> = {
                ...parsedEvent,
                type: parsedEvent.type as EventType
              };
              await handler(event);
              state.rabbitmqChannel?.ack(msg);
            } catch (error) {
              const errorContext = {
                error: error instanceof Error ? error.message : String(error),
                eventType,
                retryCount: (msg.properties?.headers?.['x-retry-count'] ?? 0) + 1,
                timestamp: new Date().toISOString(),
                correlationId: msg.properties?.headers?.['x-correlation-id'],
                source: msg.properties?.headers?.['x-event-source'],
              };

              state.logger.error('Error processing event', errorContext);

              if (errorContext.retryCount <= state.config.rabbitmq.retryCount) {
                setTimeout(() => {
                  const retryMsg = {
                    ...msg,
                    properties: {
                      ...msg.properties,
                      headers: {
                        ...msg.properties.headers,
                        'x-retry-count': errorContext.retryCount,
                      },
                    },
                  };
                  // Republish the message with updated retry count
                  state.rabbitmqChannel?.publish(
                    state.config.rabbitmq.exchange,
                    String(eventType),
                    msg.content,
                    {
                      persistent: true,
                      headers: retryMsg.properties.headers
                    }
                  );
                  // Acknowledge the original message after republishing
                  state.rabbitmqChannel?.ack(msg);
                }, state.config.rabbitmq.retryDelay);
              } else {
                // Move to dead letter queue after max retries
                state.rabbitmqChannel?.reject(msg, false);
              }
            }
          });
          state.handlers.set(eventType, handler as EventHandler);
          state.consumerTags.set(eventType, consumerTag);
        }, E.toError)
      )
    );
  };

// Unsubscribing from events
export const unsubscribe =
  (state: EventBusInternalState) =>
  (eventType: string): TE.TaskEither<Error, void> =>
    pipe(
      TE.tryCatch(async () => {
        if (!state.rabbitmqChannel) {
          throw new Error('RabbitMQ channel not initialized');
        }
        const consumerTag = state.consumerTags.get(eventType);
        if (consumerTag) {
          await state.rabbitmqChannel.cancel(consumerTag);
          state.handlers.delete(eventType);
          state.consumerTags.delete(eventType);
        }
      }, E.toError)
    );

// Cleanup
export const close = (state: EventBusInternalState): TE.TaskEither<Error, void> =>
  TE.tryCatch(async () => {
    if (state.rabbitmqChannel) {
      await state.rabbitmqChannel.close();
    }
    if (state.rabbitmqConnection) {
      await state.rabbitmqConnection.close();
    }
  }, E.toError);
