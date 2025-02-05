import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';
import { Channel, Connection } from 'amqplib';
import Redis from 'ioredis';
import { EventBusState } from './types';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  details: {
    rabbitmq: {
      connected: boolean;
      exchangeAvailable: boolean;
      queues: Array<{
        name: string;
        available: boolean;
        messageCount: number;
      }>;
    };
    redis: {
      connected: boolean;
      latency: number;
      memoryUsage: {
        used: number;
        peak: number;
        fragmentationRatio: number;
      };
    };
  };
  timestamp: string;
}

/**
 * Checks RabbitMQ connection health
 */
const checkRabbitMQ = (
  channel: Channel | null,
  connection: Connection | null,
  exchangeName: string
): TE.TaskEither<Error, HealthStatus['details']['rabbitmq']> =>
  pipe(
    TE.tryCatch(
      async () => {
        if (!channel || !connection) {
          throw new Error('RabbitMQ not initialized');
        }

        // Check exchange
        await channel.checkExchange(exchangeName);

        // Get queue information
        const queues = await channel.assertQueue('', { exclusive: true });
        const queueInfo = await channel.checkQueue(queues.queue);

        return {
          connected: true,
          exchangeAvailable: true,
          queues: [{
            name: queueInfo.queue,
            available: true,
            messageCount: queueInfo.messageCount
          }]
        };
      },
      error => new Error(`RabbitMQ health check failed: ${error}`)
    )
  );

/**
 * Checks Redis connection health
 */
const checkRedis = (
  client: Redis | null
): TE.TaskEither<Error, HealthStatus['details']['redis']> =>
  pipe(
    TE.tryCatch(
      async () => {
        if (!client) {
          throw new Error('Redis not initialized');
        }

        const startTime = Date.now();
        await client.ping();
        const latency = Date.now() - startTime;

        const info = await client.info('memory');
        const memoryInfo = info.split('\n').reduce((acc, line) => {
          const [key, value] = line.split(':');
          if (key && value) {
            acc[key.trim()] = value.trim();
          }
          return acc;
        }, {} as Record<string, string>);

        return {
          connected: true,
          latency,
          memoryUsage: {
            used: parseInt(memoryInfo['used_memory'] || '0', 10),
            peak: parseInt(memoryInfo['used_memory_peak'] || '0', 10),
            fragmentationRatio: parseFloat(memoryInfo['mem_fragmentation_ratio'] || '0')
          }
        };
      },
      error => new Error(`Redis health check failed: ${error}`)
    )
  );

/**
 * Performs a complete health check of the event system
 */
export const checkHealth = (
  state: EventBusState
): TE.TaskEither<Error, HealthStatus> =>
  pipe(
    TE.Do,
    TE.bind('rabbitmq', () => checkRabbitMQ(
      state.rabbitmqChannel,
      state.rabbitmqConnection,
      state.config.rabbitmq.exchange
    )),
    TE.bind('redis', () => checkRedis(state.redisClient)),
    TE.map(({ rabbitmq, redis }) => ({
      status: rabbitmq.connected && redis.connected ? 'healthy' : 'unhealthy',
      details: {
        rabbitmq,
        redis
      },
      timestamp: new Date().toISOString()
    }))
  ); 