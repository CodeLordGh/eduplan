import { Redis } from 'ioredis';
import { Option, some, none } from 'fp-ts/Option';
import { TaskEither, tryCatch } from 'fp-ts/TaskEither';
import { IncomingHttpHeaders } from 'http';

// Pure functions for key generation
export const createSessionKey = (sessionId: string): string =>
  `session:${sessionId}`;

export const createRateLimitKey = (ip: string, prefix = 'ratelimit:'): string =>
  `${prefix}${ip}`;

export const createOTPKey = (userId: string): string =>
  `otp:${userId}`;

export const createCacheKey = (key: string, prefix = 'cache:'): string =>
  `${prefix}${key}`;

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
export const getRedisValue = (redis: Redis) => (key: string): TaskEither<Error, Option<string>> =>
  tryCatch(
    async () => {
      const value = await redis.get(key);
      return value ? some(value) : none;
    },
    (error) => error as Error
  );

export const setRedisValue = (redis: Redis) => (key: string, value: string, ttl?: number): TaskEither<Error, boolean> =>
  tryCatch(
    async () => {
      if (ttl) {
        await redis.set(key, value, 'PX', ttl);
      } else {
        await redis.set(key, value);
      }
      return true;
    },
    (error) => error as Error
  );

export const incrementRedisValue = (redis: Redis) => (key: string): TaskEither<Error, number> =>
  tryCatch(
    () => redis.incr(key),
    (error) => error as Error
  );

export const setRedisExpiry = (redis: Redis) => (key: string, ttl: number): TaskEither<Error, boolean> =>
  tryCatch(
    async () => {
      await redis.pexpire(key, ttl);
      return true;
    },
    (error) => error as Error
  );

export const getRedisTimeToLive = (redis: Redis) => (key: string): TaskEither<Error, number> =>
  tryCatch(
    () => redis.pttl(key),
    (error) => error as Error
  );

export const deleteRedisValue = (redis: Redis) => (key: string): TaskEither<Error, boolean> =>
  tryCatch(
    async () => {
      await redis.del(key);
      return true;
    },
    (error) => error as Error
  ); 