import fp from 'fastify-plugin';
import fastifyRedis from '@fastify/redis';
import { createRedisClient, getRedisClient } from '@eduflow/middleware';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { FastifyPluginAsync } from 'fastify';
import { Redis } from 'ioredis';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

const redisPlugin: FastifyPluginAsync = async (fastify): Promise<void> => {
  const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  };

  const result = await pipe(
    getRedisClient(),
    TE.orElse(() => createRedisClient(redisConfig))
  )();

  if (result._tag === 'Left') {
    throw result.left;
  }

  const redisClient = result.right;

  await fastify.register(fastifyRedis, {
    client: redisClient,
  });
};

// @ts-expect-error - Fastify plugin type inference issues
export default fp(redisPlugin, { name: 'redis-plugin' }); 