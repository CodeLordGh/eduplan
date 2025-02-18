import { Redis } from 'ioredis';
import { FastifyRequest, FastifyReply } from 'fastify';

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyPrefix: string;
}

export const createRateLimiter = (redis: Redis, config: RateLimitConfig) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const key = `${config.keyPrefix}${request.ip}`;
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.pexpire(key, config.windowMs);
    }

    if (current > config.max) {
      reply.status(429).send({
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later.',
      });
      return;
    }
  };
}; 