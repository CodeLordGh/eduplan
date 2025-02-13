import fastify, { FastifyBaseLogger } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyRedis from '@fastify/redis';
import fastifySwagger, { SwaggerOptions } from '@fastify/swagger';
import fastifyCookie from '@fastify/cookie';
import { createLogger } from '@eduflow/common';
import authRoutes from './routes/auth.routes';
import otpRoutes from './routes/otp.routes';

const logger = createLogger('auth-service');

export const createApp = async () => {
  const app = fastify({
    logger: true,
    ajv: {
      customOptions: {
        removeAdditional: 'all',
        coerceTypes: true,
        useDefaults: true,
      },
    },
  });

  // Register plugins
  await app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'your-secret-key',
  });

  await app.register(fastifyRedis, {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });

  await app.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET || 'your-cookie-secret',
    hook: 'onRequest',
    parseOptions: {},
  });

  const swaggerOptions: SwaggerOptions = {
    openapi: {
      info: {
        title: 'Auth Service API',
        description: 'API documentation for the Auth Service',
        version: '1.0.0',
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
    hideUntagged: false,
  };

  await app.register(fastifySwagger, swaggerOptions);

  // Register routes
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(otpRoutes, { prefix: '/auth/otp' });

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    logger.error('Server error', error);
    reply.status(500).send({
      code: 'INTERNAL_SERVER_ERROR',
      message: errorMessage,
    });
  });

  return app;
};

// Start the server if this file is run directly
if (require.main === module) {
  const start = async () => {
    try {
      const app = await createApp();
      const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
      const host = process.env.HOST || '0.0.0.0';

      await app.listen({ port, host });
      logger.info(`Server listening on ${host}:${port}`);
    } catch (err) {
      logger.error('Failed to start server', err as Error);
      process.exit(1);
    }
  };

  start();
}
