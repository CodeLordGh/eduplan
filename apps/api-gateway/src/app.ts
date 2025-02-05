import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import { setupSwagger } from './config/swagger';
import { setupRedis } from './config/redis';
import { setupRoutes } from './routes';
import { setupProxies } from './config/proxy';
import { errorHandler } from './utils/error-handler';
import { 
  logger, 
  requestLogger, 
  createResponseContext, 
  createSecurityContext,
  createPerformanceContext,
  logSecurityEvent,
  logPerformanceMetric
} from './config/logger';
import { createVersionManager } from './services/version.service';
import { Server, IncomingMessage, ServerResponse } from 'http';
import { createMetricsCollector } from './utils/metrics';
import { createCorrelationContext, withCorrelation } from './utils/correlation';
import { trackMemoryUsage } from './utils/performance';

const server = fastify<Server, IncomingMessage, ServerResponse>({
  logger: logger
});

async function start() {
  try {
    // Initialize metrics collector
    const metricsCollector = createMetricsCollector();
    metricsCollector.startCollection();

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

    // Add correlation ID, metrics tracking, and version middleware
    server.addHook('onRequest', async (request, reply) => {
      const correlationContext = createCorrelationContext(request);
      return withCorrelation(correlationContext, async () => {
        metricsCollector.incrementRequestCount();
        metricsCollector.incrementConnections();
        request.correlationId = correlationContext.id;
      });
    });

    server.addHook('onRequest', versionManager.middleware);
    server.addHook('onRequest', requestLogger);

    // Add response logging with performance metrics
    server.addHook('onResponse', async (request, reply) => {
      metricsCollector.decrementConnections();
      const responseTime = reply.getResponseTime();
      
      await withCorrelation(createCorrelationContext(request), async () => {
        const context = createResponseContext(request, reply.statusCode, responseTime);
        logger.info('Request completed', context);

        // Log performance metric if response time is significant
        if (responseTime > 1000) { // 1 second threshold
          logPerformanceMetric(createPerformanceContext(
            request,
            'response_time',
            responseTime,
            'ms',
            1000
          ));
        }

        // Log security events for significant status codes
        if (reply.statusCode === 401 || reply.statusCode === 403) {
          logSecurityEvent(createSecurityContext(
            request,
            'authentication_failure',
            'medium',
            'blocked',
            { statusCode: reply.statusCode }
          ));
        }

        // Track memory usage periodically
        if (Math.random() < 0.1) { // 10% sampling
          trackMemoryUsage(request);
        }
      });
    });

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

    // Add health check with logging
    server.get('/health', async (request) => {
      const status = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: versionManager.getCurrentVersion()
      };
      
      await withCorrelation(createCorrelationContext(request), async () => {
        logger.info('Health check', status);
      });
      
      return status;
    });

    // Start the server
    await server.listen({ port: 4000, host: '0.0.0.0' });
    logger.info('API Gateway started on port 4000', {
      service: 'api-gateway',
      environment: process.env.NODE_ENV || 'development',
      supportedVersions: versionManager.getSupportedVersions(),
      deprecatedVersions: versionManager.getDeprecatedVersions()
    });
  } catch (err) {
    logger.error('Error starting server:', { 
      service: 'api-gateway',
      environment: process.env.NODE_ENV || 'development',
      error: err instanceof Error ? err.stack : err 
    });
    process.exit(1);
  }
}

// Handle graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down API Gateway...');
  await server.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start(); 