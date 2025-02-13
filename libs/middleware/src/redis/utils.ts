import { Redis } from 'ioredis';
import { Option, some, none } from 'fp-ts/Option';
import { TaskEither, tryCatch } from 'fp-ts/TaskEither';
import { AppError } from '@eduflow/types';
import { createAppError } from '@eduflow/common';
import { IncomingHttpHeaders } from 'http';

// Pure functions for key generation
export const createSessionKey = (sessionId: string): string => `session:${sessionId}`;

export const createRateLimitKey = (ip: string, prefix = 'ratelimit:'): string => `${prefix}${ip}`;

export const createOTPKey = (userId: string): string => `otp:${userId}`;

export const createCacheKey = (key: string, prefix = 'cache:'): string => `${prefix}${key}`;

// Pure functions for data transformation
export const parseJSON = <T>(data: string): Option<T> => {
  try {
    return some(JSON.parse(data));
  } catch {
    return none;
  }
};

export const getHeaderValue = (headers: IncomingHttpHeaders, key: string): Option<string> => {
  const value = headers[key];
  return typeof value === 'string' ? some(value) : none;
};

// Redis operations as pure functions
export const getRedisValue =
  (redis: Redis) =>
  (key: string): TaskEither<AppError, Option<string>> =>
    tryCatch(
      async () => {
        const value = await redis.get(key);
        return value ? some(value) : none;
      },
      (error) =>
        createAppError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get Redis value',
          cause: error,
          metadata: {
            service: 'redis',
            operation: 'get',
            timestamp: new Date(),
          },
        })
    );

export const setRedisValue =
  (redis: Redis) =>
  (key: string, value: string, ttl?: number): TaskEither<AppError, boolean> =>
    tryCatch(
      async () => {
        if (ttl) {
          await redis.set(key, value, 'PX', ttl);
        } else {
          await redis.set(key, value);
        }
        return true;
      },
      (error) =>
        createAppError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to set Redis value',
          cause: error,
          metadata: {
            service: 'redis',
            operation: 'set',
            timestamp: new Date(),
          },
        })
    );

export const incrementRedisValue =
  (redis: Redis) =>
  (key: string): TaskEither<AppError, number> =>
    tryCatch(
      () => redis.incr(key),
      (error) =>
        createAppError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to increment Redis value',
          cause: error,
          metadata: {
            service: 'redis',
            operation: 'incr',
            timestamp: new Date(),
          },
        })
    );

export const setRedisExpiry =
  (redis: Redis) =>
  (key: string, ttl: number): TaskEither<AppError, boolean> =>
    tryCatch(
      async () => {
        await redis.pexpire(key, ttl);
        return true;
      },
      (error) =>
        createAppError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to set Redis expiry',
          cause: error,
          metadata: {
            service: 'redis',
            operation: 'expire',
            timestamp: new Date(),
          },
        })
    );

export const getRedisTimeToLive =
  (redis: Redis) =>
  (key: string): TaskEither<AppError, number> =>
    tryCatch(
      () => redis.pttl(key),
      (error) =>
        createAppError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get Redis TTL',
          cause: error,
          metadata: {
            service: 'redis',
            operation: 'ttl',
            timestamp: new Date(),
          },
        })
    );

export const deleteRedisValue =
  (redis: Redis) =>
  (key: string): TaskEither<AppError, boolean> =>
    tryCatch(
      async () => {
        await redis.del(key);
        return true;
      },
      (error) =>
        createAppError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete Redis value',
          cause: error,
          metadata: {
            service: 'redis',
            operation: 'del',
            timestamp: new Date(),
          },
        })
    );
