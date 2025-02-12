import { Redis } from 'ioredis';
import { FastifyRequest, FastifyReply } from 'fastify';
import { RateLimitConfig } from './types';
import {
  createRateLimitKey,
  incrementRedisValue,
  setRedisExpiry,
  getRedisTimeToLive,
} from './utils';
import { setRateLimitHeaders, sendTooManyRequests } from './response';

export const createRateLimiter =
  (redis: Redis, config: RateLimitConfig) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
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
