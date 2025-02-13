import Redis from 'ioredis';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { AppError } from '@eduflow/types';
import { createAppError } from '@eduflow/common';

// Configuration type
export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
}

// Default configuration
const defaultConfig: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  keyPrefix: process.env.REDIS_PREFIX,
};

// Create Redis client with provided or default config
export const createRedisClient = (
  config: Partial<RedisConfig> = {}
): TE.TaskEither<AppError, Redis> =>
  pipe(
    TE.tryCatch(
      async () => {
        const finalConfig = { ...defaultConfig, ...config };
        return new Redis(finalConfig);
      },
      (error) =>
        createAppError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create Redis client',
          cause: error,
          metadata: {
            service: 'redis',
            operation: 'connect',
            timestamp: new Date(),
          },
        })
    )
  );

// Singleton instance for reuse
let redisClient: Redis | null = null;

// Get or create Redis client
export const getRedisClient = (): TE.TaskEither<AppError, Redis> =>
  pipe(
    TE.tryCatch(
      async () => {
        if (!redisClient) {
          redisClient = await new Redis(defaultConfig);
        }
        return redisClient;
      },
      (error) =>
        createAppError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get Redis client',
          cause: error,
          metadata: {
            service: 'redis',
            operation: 'connect',
            timestamp: new Date(),
          },
        })
    )
  );
