import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { setRedisValue, getRedisValue } from '@eduflow/middleware';

const testRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  // Test Redis
  fastify.get('/test/redis', async (_request, reply) => {
    reply.header('x-bypass-session', 'true');
    
    const testKey = 'test:key';
    const testValue = 'test-value';

    const result = await pipe(
      setRedisValue(fastify.redis)(testKey, testValue),
      TE.chain(() => getRedisValue(fastify.redis)(testKey))
    )();

    if (result._tag === 'Left') {
      throw result.left;
    }

    return {
      success: true,
      value: result.right,
    };
  });

  // Test Session
  fastify.get('/test/session', async (request, _reply) => {
    return {
      success: true,
      session: request.session || null,
    };
  });
};

// @ts-expect-error - Fastify plugin type inference issues
export default fp(testRoutes, {
  name: 'test-routes',
  dependencies: ['redis-plugin', 'session-plugin'],
});