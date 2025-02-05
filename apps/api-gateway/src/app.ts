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
import { createVersionManager } from './services/version.service';
import { Server, IncomingMessage, ServerResponse } from 'http';

const server = fastify<Server, IncomingMessage, ServerResponse>({
  logger: logger
});

async function start() {
  try {
    // Register plugins
    await server.register(cors);
    await server.register(helmet);
    await server.register(compress);

    // Setup version management
    const versionManager = createVersionManager({
      defaultVersion: 'v1',
      supportedVersions: ['v1', 'v2'],
      deprecatedVersions: [],
      versionExtractor: (request) => {
        // Try URL path first
        const pathMatch = request.url.match(/\/api\/(v\d+)\//);
        if (pathMatch) return pathMatch[1];
        
        // Try header next
        const headerVersion = request.headers['api-version'];
        if (headerVersion) return headerVersion.toString();
        
        // Fall back to default
        return 'v1';
      }
    });

    // Add correlation ID and version middleware
    server.addHook('onRequest', (request, _reply, done) => {
      request.correlationId = request.headers['x-correlation-id'] as string || request.id;
      done();
    });
    server.addHook('onRequest', versionManager.middleware);
    server.addHook('onRequest', requestLogger);

    // Setup Redis
    await setupRedis(server);

    // Setup Swagger documentation
    await setupSwagger(server);

    // Setup service proxies with version support
    await setupProxies(server, versionManager);

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