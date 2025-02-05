import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import { setupSwagger } from './config/swagger';
import { setupRedis } from './config/redis';
import { setupRoutes } from './routes';
import { setupProxies } from './config/proxy';
import { errorHandler } from './utils/error-handler';
import { logger, requestLogger } from './config/logger';

const server = fastify({
  logger
});

async function start() {
  try {
    // Register plugins
    await server.register(cors);
    await server.register(helmet);
    await server.register(compress);

    // Add correlation ID middleware
    server.addHook('onRequest', (request, _reply, done) => {
      request.correlationId = request.headers['x-correlation-id'] as string || request.id;
      done();
    });

    // Add request logging middleware
    server.addHook('onRequest', requestLogger);

    // Setup Redis
    await setupRedis(server);

    // Setup Swagger documentation
    await setupSwagger(server);

    // Setup service proxies
    await setupProxies(server);

    // Setup routes
    await setupRoutes(server);

    // Register error handler
    server.setErrorHandler(errorHandler);

    // Start the server
    await server.listen({ port: 4000, host: '0.0.0.0' });
    logger.info('API Gateway started on port 4000');
  } catch (err) {
    logger.error('Error starting server:', { error: err instanceof Error ? err.stack : err });
    process.exit(1);
  }
}

start(); 