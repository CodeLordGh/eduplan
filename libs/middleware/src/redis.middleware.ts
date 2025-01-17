import { Redis } from 'ioredis';
import { FastifyRequest, FastifyReply } from 'fastify';
import { pipe } from 'fp-ts/function';
import { Option, some, none, chain as optionChain } from 'fp-ts/Option';
import { TaskEither, tryCatch, chain as taskEitherChain, right as taskEitherRight } from 'fp-ts/TaskEither';
import { IncomingHttpHeaders } from 'http';

// Types
export interface SessionData {
  userId: string;
  role: string;
  permissions: string[];
  createdAt: number;
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyPrefix?: string;
}

export interface OTPData {
  code: string;
  purpose: string;
  expiresAt: number;
}

export interface CacheConfig {
  ttl: number;
  prefix?: string;
}

// Pure functions for key generation
const createSessionKey = (sessionId: string): string =>
  `session:${sessionId}`;

const createRateLimitKey = (ip: string, prefix = 'ratelimit:'): string =>
  `${prefix}${ip}`;

const createOTPKey = (userId: string): string =>
  `otp:${userId}`;

const createCacheKey = (key: string, prefix = 'cache:'): string =>
  `${prefix}${key}`;

// Pure functions for data transformation
const parseJSON = <T>(data: string): Option<T> => {
  try {
    return some(JSON.parse(data));
  } catch {
    return none;
  }
};

const getHeaderValue = (headers: IncomingHttpHeaders, key: string): Option<string> => {
  const value = headers[key];
  return typeof value === 'string' ? some(value) : none;
};

// Redis operations as pure functions
const getRedisValue = (redis: Redis) => (key: string): TaskEither<Error, Option<string>> =>
  tryCatch(
    async () => {
      const value = await redis.get(key);
      return value ? some(value) : none;
    },
    (error) => error as Error
  );

const setRedisValue = (redis: Redis) => (key: string, value: string, ttl?: number): TaskEither<Error, boolean> =>
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

const incrementRedisValue = (redis: Redis) => (key: string): TaskEither<Error, number> =>
  tryCatch(
    () => redis.incr(key),
    (error) => error as Error
  );

const setRedisExpiry = (redis: Redis) => (key: string, ttl: number): TaskEither<Error, boolean> =>
  tryCatch(
    async () => {
      await redis.pexpire(key, ttl);
      return true;
    },
    (error) => error as Error
  );

const getRedisTimeToLive = (redis: Redis) => (key: string): TaskEither<Error, number> =>
  tryCatch(
    () => redis.pttl(key),
    (error) => error as Error
  );

const deleteRedisValue = (redis: Redis) => (key: string): TaskEither<Error, boolean> =>
  tryCatch(
    async () => {
      await redis.del(key);
      return true;
    },
    (error) => error as Error
  );

// Response handlers
const sendUnauthorized = (reply: FastifyReply, message: string): void => {
  reply.status(401).send({ error: message });
};

const sendTooManyRequests = (reply: FastifyReply, retryAfter: number): void => {
  reply.status(429).send({
    error: 'Too many requests',
    retryAfter: Math.ceil(retryAfter / 1000)
  });
};

const setRateLimitHeaders = (reply: FastifyReply, max: number, remaining: number, reset: number): void => {
  reply.header('X-RateLimit-Limit', max);
  reply.header('X-RateLimit-Remaining', Math.max(0, remaining));
  reply.header('X-RateLimit-Reset', reset);
};

// Middleware factories
export const createSessionMiddleware = (redis: Redis) => async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const sessionId = pipe(
    request.headers,
    headers => getHeaderValue(headers, 'session-id')
  );

  if (sessionId._tag === 'None') {
    sendUnauthorized(reply, 'No session ID provided');
    return;
  }

  const sessionData = await pipe(
    sessionId.value,
    createSessionKey,
    getRedisValue(redis)
  )();

  if (sessionData._tag === 'Left') {
    sendUnauthorized(reply, 'Session error');
    return;
  }

  if (sessionData.right._tag === 'None') {
    sendUnauthorized(reply, 'Invalid or expired session');
    return;
  }

  const session = pipe(
    sessionData.right.value,
    data => parseJSON<SessionData>(data)
  );

  if (session._tag === 'None') {
    sendUnauthorized(reply, 'Invalid session data');
    return;
  }

  request.session = session.value;
};

export const createRateLimiter = (redis: Redis, config: RateLimitConfig) => async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const { windowMs, max, keyPrefix = 'ratelimit:' } = config;
  const key = createRateLimitKey(request.ip, keyPrefix);

  const current = await incrementRedisValue(redis)(key)();
  if (current._tag === 'Left') {
    return;
  }

  if (current.right === 1) {
    await setRedisExpiry(redis)(key, windowMs)();
  }

  const ttl = await getRedisTimeToLive(redis)(key)();
  if (ttl._tag === 'Left') {
    return;
  }

  setRateLimitHeaders(reply, max, max - current.right, Date.now() + ttl.right);

  if (current.right > max) {
    sendTooManyRequests(reply, ttl.right);
  }
};

// OTP Management
export const createOTPManager = (redis: Redis) => ({
  store: (userId: string, otpData: OTPData): TaskEither<Error, boolean> =>
    pipe(
      createOTPKey(userId),
      key => setRedisValue(redis)(key, JSON.stringify(otpData), otpData.expiresAt - Date.now())
    ),

  verify: async (userId: string, code: string): Promise<boolean> => {
    const otpData = await pipe(
      createOTPKey(userId),
      getRedisValue(redis)
    )();

    if (otpData._tag === 'Left' || otpData.right._tag === 'None') {
      return false;
    }

    const parsedOTP = pipe(
      otpData.right.value,
      data => parseJSON<OTPData>(data)
    );

    if (parsedOTP._tag === 'None') {
      return false;
    }

    const isValid = parsedOTP.value.code === code && Date.now() <= parsedOTP.value.expiresAt;
    if (isValid) {
      await deleteRedisValue(redis)(createOTPKey(userId))();
    }

    return isValid;
  }
});

// Cache Management
export const createCacheManager = (redis: Redis) => ({
  get: <T>(key: string, prefix = 'cache:'): TaskEither<Error, Option<T>> =>
    pipe(
      createCacheKey(key, prefix),
      getRedisValue(redis),
      taskEitherChain((optionStr: Option<string>) =>
        taskEitherRight(
          pipe(
            optionStr,
            optionChain((str: string) => parseJSON<T>(str))
          )
        )
      )
    ),

  set: <T>(key: string, data: T, { ttl, prefix = 'cache:' }: CacheConfig): TaskEither<Error, boolean> =>
    pipe(
      createCacheKey(key, prefix),
      cacheKey => setRedisValue(redis)(cacheKey, JSON.stringify(data), ttl)
    ),

  delete: (key: string, prefix = 'cache:'): TaskEither<Error, boolean> =>
    pipe(
      createCacheKey(key, prefix),
      deleteRedisValue(redis)
    )
}); 