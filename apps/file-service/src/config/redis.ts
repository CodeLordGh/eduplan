import Redis from 'ioredis';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';
import { createError, type BaseError } from '@eduflow/common';

type RedisClientConfig = {
  client: Redis;
  connect: () => TE.TaskEither<BaseError, void>;
  disconnect: () => TE.TaskEither<BaseError, void>;
};

export const createRedisClient = (): TE.TaskEither<BaseError, RedisClientConfig> => {
  if (!process.env.REDIS_URL) {
    return TE.fromEither(
      E.left(
        createError(
          'REDIS_URL environment variable is not set',
          'REDIS_CONFIG_ERROR',
          500
        )
      )
    );
  }

  try {
    const client = new Redis(process.env.REDIS_URL);

    const connect = (): TE.TaskEither<BaseError, void> =>
      pipe(
        TE.tryCatch(
          async () => {
            await new Promise<void>((resolve, reject) => {
              client.once('connect', () => resolve());
              client.once('error', (error) => reject(error));
            });
          },
          (error) => createError('Failed to connect to Redis', 'REDIS_CONNECTION_ERROR', 500, error)
        )
      );

    const disconnect = (): TE.TaskEither<BaseError, void> =>
      pipe(
        TE.tryCatch(
          async () => {
            await client.quit();
          },
          (error) => createError('Failed to disconnect from Redis', 'REDIS_DISCONNECT_ERROR', 500, error)
        )
      );

    return TE.right({
      client,
      connect,
      disconnect
    });
  } catch (error) {
    return TE.fromEither(
      E.left(
        createError(
          'Failed to initialize Redis client',
          'REDIS_INIT_ERROR',
          500,
          error
        )
      )
    );
  }
};

export type RedisClient = Awaited<ReturnType<ReturnType<typeof createRedisClient>>>;
