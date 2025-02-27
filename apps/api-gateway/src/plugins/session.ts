import fp from 'fastify-plugin';
import { createSessionMiddleware } from '@eduflow/middleware';
import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import '@fastify/redis';

const BYPASS_SESSION_HEADER = 'x-bypass-session';

const sessionPlugin: FastifyPluginAsync = async (fastify): Promise<void> => {
  const sessionMiddleware = createSessionMiddleware(fastify.redis);
  
  fastify.addHook('preHandler', async (request: FastifyRequest, reply) => {
    if (request.headers[BYPASS_SESSION_HEADER] === 'true') {
      return;
    }
    await sessionMiddleware(request, reply);
  });
};

// @ts-expect-error - Fastify plugin type inference issues
export default fp(sessionPlugin, {
  name: 'session-plugin',
  dependencies: ['redis-plugin'],
}); 