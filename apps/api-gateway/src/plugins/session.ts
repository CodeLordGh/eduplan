import fp from 'fastify-plugin';
import { createSessionMiddleware } from '@eduflow/middleware';
import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import '@fastify/redis';
import { SessionData } from '@eduflow/middleware/src/redis/types';

const BYPASS_SESSION_HEADER = 'x-bypass-session';

declare module 'fastify' {
  interface FastifyRequest {
    session: SessionData;
  }
}

const sessionPlugin: FastifyPluginAsync = async (fastify): Promise<void> => {
  const sessionMiddleware = createSessionMiddleware(fastify.redis);
  
  fastify.addHook('preHandler', async (request: FastifyRequest, reply) => {
    // Bypass session check for Swagger documentation routes
    if (request.url.startsWith('/documentation')) {
      request.session = {
        userId: '',
        role: '',
        permissions: [],
        createdAt: Date.now()
      };
      return;
    }

    try {
      if (request.headers[BYPASS_SESSION_HEADER] === 'true') {
        // Initialize an empty session for bypassed requests
        request.session = {
          userId: '',
          role: '',
          permissions: [],
          createdAt: Date.now()
        };
        return;
      }
      await sessionMiddleware(request, reply);
    } catch (error) {
      // If no session ID, initialize an empty session
      if (error instanceof Error && error.message === 'No session ID provided') {
        request.session = {
          userId: '',
          role: '',
          permissions: [],
          createdAt: Date.now()
        };
        return;
      }
      throw error;
    }
  });
};

// @ts-expect-error - Fastify plugin type inference issues
export default fp(sessionPlugin, {
  name: 'session-plugin',
  dependencies: ['redis-plugin'],
});