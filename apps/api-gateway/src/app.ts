import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import { setupSwagger } from './config/swagger';
import { setupRedis } from './config/redis';
import { setupRoutes } from './routes';
import { setupProxies } from './config/proxy';
import { errorHandler } from './utils/error-handler';

const server = fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    }
  },
  trustProxy: true
});

async function start() {
  try {
    // Register plugins
    await server.register(cors);
    await server.register(helmet);
    await server.register(compress);

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
    server.log.info('API Gateway started on port 4000');
  } catch (err) {
    console.error('[ERROR] Error starting server:', err instanceof Error ? err.stack : err);
    process.exit(1);
  }
}

start(); 