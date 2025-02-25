import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import jwt from '@fastify/jwt';
import { config } from 'dotenv';
import { resolve } from 'path';
import { setupSwagger } from './config/swagger';
import { setupRedis } from './config/redis';
import { setupRoutes } from './routes';
import { setupProxies } from './config/proxy';
import { errorHandler } from './utils/error-handler';
import {
  logger,
  createResponseContext,
  createSecurityContext,
  createPerformanceContext,
  logSecurityEvent,
  logPerformanceMetric,
} from './config/logger';
import { createVersionManager } from './services/version.service';
import { Server, IncomingMessage, ServerResponse } from 'http';
import { createMetricsCollector } from './utils/metrics';
import { createCorrelationContext, withCorrelation } from './utils/correlation';
import { trackMemoryUsage } from './utils/performance';

// Load environment variables
config({ path: resolve(__dirname, '../.env') });

const server = fastify<Server, IncomingMessage, ServerResponse>({
  logger: logger,
});

async function start() {
  try {
    // Log environment variables (excluding sensitive ones)
    logger.info('Starting with configuration:', {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      REDIS_HOST: process.env.REDIS_HOST,
      REDIS_PORT: process.env.REDIS_PORT,
      CORS_ORIGIN: process.env.CORS_ORIGIN,
      API_DEFAULT_VERSION: process.env.API_DEFAULT_VERSION
    });

    try {
      // Initialize metrics collector
      logger.info('Initializing metrics collector...');
      const metricsCollector = createMetricsCollector();
      metricsCollector.startCollection();

      // Register plugins one by one with error handling
      logger.info('Registering Fastify plugins...');
      
      try {
        await server.register(cors);
        logger.info('CORS plugin registered');
      } catch (corsError) {
        throw new Error(`Failed to register CORS plugin: ${corsError instanceof Error ? corsError.message : String(corsError)}`);
      }

      try {
        await server.register(helmet);
        logger.info('Helmet plugin registered');
      } catch (helmetError) {
        throw new Error(`Failed to register Helmet plugin: ${helmetError instanceof Error ? helmetError.message : String(helmetError)}`);
      }

      try {
        await server.register(compress);
        logger.info('Compress plugin registered');
      } catch (compressError) {
        throw new Error(`Failed to register Compress plugin: ${compressError instanceof Error ? compressError.message : String(compressError)}`);
      }

      try {
        await server.register(jwt, {
          secret: process.env.JWT_SECRET || 'your-secret-key',
          sign: {
            expiresIn: process.env.JWT_EXPIRATION || '1h'
          }
        });
        logger.info('JWT plugin registered');
      } catch (jwtError) {
        throw new Error(`Failed to register JWT plugin: ${jwtError instanceof Error ? jwtError.message : String(jwtError)}`);
      }

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
        },
      });

      // Add correlation ID, metrics tracking, and version middleware
      server.addHook('onRequest', async (request) => {
        const correlationContext = createCorrelationContext(request);
        return withCorrelation(correlationContext, async () => {
          metricsCollector.incrementRequestCount();
          metricsCollector.incrementConnections();
          request.correlationId = correlationContext.id;
        });
      });

      server.addHook('onRequest', versionManager.middleware);

      // Add response logging with performance metrics
      server.addHook('onResponse', async (request, reply) => {
        metricsCollector.decrementConnections();
        const responseTime = reply.getResponseTime();

        await withCorrelation(createCorrelationContext(request), async () => {
          const context = createResponseContext(request, reply.statusCode, responseTime);
          logger.info('Request completed', context);

          // Log performance metric if response time is significant
          if (responseTime > 1000) {
            // 1 second threshold
            logPerformanceMetric(
              createPerformanceContext(request, 'response_time', responseTime, 'ms', 1000)
            );
          }

          // Log security events for significant status codes
          if (reply.statusCode === 401 || reply.statusCode === 403) {
            logSecurityEvent(
              createSecurityContext(request, 'authentication_failure', 'medium', 'blocked', {
                statusCode: reply.statusCode,
              })
            );
          }

          // Track memory usage periodically
          if (Math.random() < 0.1) {
            // 10% sampling
            trackMemoryUsage(request);
          }
        });
      });

      // Setup Redis
      logger.info('Setting up Redis connection...');
      await setupRedis(server);

      // Setup Swagger documentation
      logger.info('Setting up Swagger documentation...');
      await setupSwagger(server);

      // Setup service proxies with version support
      logger.info('Setting up service proxies...');
      await setupProxies(server, versionManager);

      // Setup routes
      logger.info('Setting up routes...');
      await setupRoutes(server);

      // Register error handler
      server.setErrorHandler(errorHandler);

      // Add health check with logging
      server.get('/health', async (request) => {
        const status = {
          status: 'ok',
          timestamp: new Date().toISOString(),
          version: versionManager.getCurrentVersion(),
        };

        await withCorrelation(createCorrelationContext(request), async () => {
          logger.info('Health check', status);
        });

        return status;
      });

      // Start the server
      const port = parseInt(process.env.PORT || '4000', 10);
      await server.listen({ port, host: '0.0.0.0' });
      
      logger.info('API Gateway started successfully', {
        port,
        environment: process.env.NODE_ENV
      });
    } catch (innerError) {
      const errorMessage = innerError instanceof Error ? innerError.message : String(innerError);
      logger.error('Failed to initialize server components:', {
        error: errorMessage,
        stack: innerError instanceof Error ? innerError.stack : undefined
      });
      throw new Error(`Failed to initialize server components: ${errorMessage}`);
    }
  } catch (err) {
    const errorDetails = err instanceof Error ? {
      message: err.message,
      stack: err.stack,
      name: err.name
    } : { unknownError: String(err) };

    logger.error('Error starting server:', {
      service: 'api-gateway',
      environment: process.env.NODE_ENV || 'development',
      error: errorDetails
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
