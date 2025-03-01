import fastify, { FastifyInstance } from 'fastify';
import { pipe } from 'fp-ts/function';
import * as E from 'fp-ts/Either';
import { createLogger, Logger } from '@eduflow/logger';
import { createAppError } from '@eduflow/common';
import { loadEnvConfig } from './config/env';
import securityPlugin from './plugins/security';
import redisPlugin from './plugins/redis';
import sessionPlugin from './plugins/session';
import proxyPlugin from './plugins/proxy';
import testRoutes from './routes/test';

const logger: Logger = createLogger('api-gateway', {
  level: process.env.LOG_LEVEL || 'info'
});

const createServer = (): FastifyInstance => {
  const server = fastify({
    logger: false,
    trustProxy: true
  });

  return server;
};

const setupServer = async (server: FastifyInstance, port: number): Promise<void> => {
  try {
    logger.info('Starting server setup...');

    logger.info('Registering security plugin...');
    // @ts-expect-error - Fastify plugin type inference issues
    await server.register(securityPlugin, { logger });

    logger.info('Registering Redis plugin...');
    // @ts-expect-error - Fastify plugin type inference issues
    await server.register(redisPlugin);

    logger.info('Registering session plugin...');
    // @ts-expect-error - Fastify plugin type inference issues
    await server.register(sessionPlugin);

    logger.info('Registering proxy plugin...');
    // @ts-expect-error - Fastify plugin type inference issues
    await server.register(proxyPlugin);

    logger.info('Registering test routes...');
    // @ts-expect-error - Fastify plugin type inference issues
    await server.register(testRoutes);

    logger.info(`Starting server on port ${port}...`);
    await server.listen({ port, host: '0.0.0.0' });
    logger.info(`Server listening on port ${port}`);
  } catch (err) {
    if (err instanceof Error) {
      logger.error('Error starting server', { 
        error: err,
        stack: err.stack,
        message: err.message,
        name: err.name
      });
    } else {
      const appError = createAppError({
        code: 'INTERNAL_SERVER_ERROR',
        message: String(err),
        cause: err
      });
      logger.error('Error starting server', { 
        error: appError,
        rawError: err
      });
    }
    process.exit(1);
  }
};

const main = (): Promise<void> =>
  pipe(
    loadEnvConfig(),
    E.fold(
      (error) => {
        logger.error({ err: error }, 'Failed to load environment configuration');
        process.exit(1);
      },
      async (config) => {
        const server = createServer();
        await setupServer(server, config.PORT);
      }
    )
  );

process.on('unhandledRejection', (err) => {
  if (err instanceof Error) {
    logger.error({ err }, 'Unhandled rejection');
  } else {
    logger.error({ err: createAppError({
      code: 'INTERNAL_SERVER_ERROR',
      message: String(err),
      cause: err
    }) }, 'Unhandled rejection');
  }
  process.exit(1);
});

main().catch((err) => {
  if (err instanceof Error) {
    logger.error({ err }, 'Unhandled error');
  } else {
    logger.error({ err: createAppError({
      code: 'INTERNAL_SERVER_ERROR',
      message: String(err),
      cause: err
    }) }, 'Unhandled error');
  }
  process.exit(1);
});