import { FastifyPluginAsync } from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import fp from 'fastify-plugin';
import { createAppError } from '@eduflow/common';
import { Logger } from '@eduflow/types';

export interface SecurityPluginOptions {
  logger: Logger;
}

const securityPlugin: FastifyPluginAsync<SecurityPluginOptions> = async (
  fastify,
  opts
): Promise<void> => {
  const { logger } = opts;
  
  try {
    // Register helmet
    await fastify.register(helmet as never, {
      global: true,
      crossOriginResourcePolicy: {
        policy: 'cross-origin'
      },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
        }
      }
    });

    // Register CORS
    await fastify.register(cors as never, {
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    });
    
    logger.info('Security plugins registered successfully');
  } catch (error) {
    const err = error instanceof Error ? error : createAppError({
      code: 'BAD_REQUEST',
      message: 'Unknown error',
      cause: error
    });
    logger.error('Failed to register security plugins', { error: err });
    throw createAppError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to register security plugins',
      cause: err
    });
  }
};

// @ts-expect-error - Fastify plugin type inference issues
export default fp(securityPlugin, {
  name: 'security',
  fastify: '5.x'
}); 