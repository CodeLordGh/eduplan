import { config } from 'dotenv';
import { createLogger, LogLevel } from '@eduflow/logger';
import { createEventBusState, initialize, subscribe, close } from '@eduflow/events';
import { getRedisClient } from '@eduflow/middleware';
import { Event } from '@eduflow/types';
import { RegistrationEvent, VerificationEvent, EventContext } from './registration/types';
import { handleRegistrationEvent, handleVerificationEvent } from './registration/handlers';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { Redis } from 'ioredis';

// Load environment variables
config();

// Create logger
const logger = createLogger('school-service', {
  environment: process.env.NODE_ENV || 'development',
  minLevel: process.env.LOG_LEVEL || 'info',
  metadata: {
    version: process.env.APP_VERSION || '1.0.0'
  }
});

// Initialize event bus
const initEventBus = async () => {
  const config = {
    serviceName: 'school-service',
    rabbitmq: {
      url: process.env.RABBITMQ_URL || 'amqp://localhost',
      exchange: 'eduflow',
      deadLetterExchange: 'eduflow.dlx',
      retryCount: 3,
      retryDelay: 1000,
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost',
      keyPrefix: 'eduflow:events',
      eventTTL: 3600,
    },
  };

  const state = createEventBusState(config, logger);
  const initializedState = await pipe(
    initialize(state),
    TE.getOrElse((error) => {
      logger.error('Failed to initialize event bus', { error });
      process.exit(1);
    })
  )();

  // Register event handlers
  await pipe(
    subscribe(initializedState)('REGISTRATION_INITIATED', async (wrappedEvent: Event<unknown>) => {
      const event: RegistrationEvent = {
        type: 'REGISTRATION_INITIATED',
        data: wrappedEvent.data as RegistrationEvent['data'],
      };
      await handleRegistrationEvent(event, {
        eventId: wrappedEvent.metadata.correlationId,
        timestamp: new Date(wrappedEvent.metadata.timestamp),
        source: wrappedEvent.metadata.source,
        requestId: wrappedEvent.metadata.correlationId,
        userId: '', // TODO: Extract from event if available
        clientInfo: { ip: '', userAgent: '' }, // TODO: Extract from event if available
        logger,
      })();
    }),
    TE.getOrElse((error) => {
      logger.error('Failed to subscribe to registration events', { error });
      process.exit(1);
    })
  )();

  await pipe(
    subscribe(initializedState)(
      'VERIFICATION_STATUS_CHANGED',
      async (wrappedEvent: Event<unknown>) => {
        const event: VerificationEvent = {
          type: 'VERIFICATION_STATUS_CHANGED',
          data: wrappedEvent.data as VerificationEvent['data'],
        };
        await handleVerificationEvent(event, {
          eventId: wrappedEvent.metadata.correlationId,
          timestamp: new Date(wrappedEvent.metadata.timestamp),
          source: wrappedEvent.metadata.source,
          requestId: wrappedEvent.metadata.correlationId,
          userId: '', // TODO: Extract from event if available
          clientInfo: { ip: '', userAgent: '' }, // TODO: Extract from event if available
          logger,
        })();
      }
    ),
    TE.getOrElse((error) => {
      logger.error('Failed to subscribe to verification events', { error });
      process.exit(1);
    })
  )();

  logger.info('Event handlers registered');
  return initializedState;
};

// Initialize Redis
const initRedis = async (): Promise<Redis> => {
  const redis = await pipe(
    getRedisClient(),
    TE.getOrElse((error) => {
      logger.error('Failed to initialize Redis', { error });
      process.exit(1);
    })
  )();

  logger.info('Redis client initialized');
  return redis as Redis;
};

// Start service
const start = async () => {
  try {
    // Initialize dependencies
    const redis = await initRedis();
    const eventBusState = await initEventBus();

    logger.info('School service started');
  } catch (error) {
    logger.error('Failed to start service', { error });
    process.exit(1);
  }
};

// Handle shutdown
const shutdown = async () => {
  try {
    // Close Redis connection
    const redis = await initRedis();
    if (redis && typeof redis.quit === 'function') {
      await redis.quit();
    }

    // Close event bus
    const eventBusState = await initEventBus();
    await pipe(
      close(eventBusState),
      TE.getOrElse((error) => {
        logger.error('Failed to close event bus', { error });
        process.exit(1);
      })
    )();

    logger.info('Service shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
};

// Handle process signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the service
start();
