import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyRedis from '@fastify/redis';
import { Redis, RedisOptions } from 'ioredis';
import { createRateLimiter, createOTPManager, RateLimitConfig } from '@eduflow/middleware';
import { createSessionMiddleware, createCacheManager } from '@eduflow/middleware';
import { logger } from '../config/logger';

// Routes that don't require session validation
const PUBLIC_ROUTES = [
  '/documentation',
  '/documentation/*',
  '/documentaion', // Common typo
  '/documentaion/*', // Common typo
  '/docs',
  '/docs/*',
  '/swagger/*',
  '/swagger.json',
  '/swagger-ui/*',
  '/health',
  '/favicon.ico',
];

const isPublicRoute = (url: string) => {
  // Normalize URL by removing query parameters
  const normalizedUrl = url.split('?')[0];

  return PUBLIC_ROUTES.some((route) => {
    if (route.endsWith('/*')) {
      const baseRoute = route.slice(0, -2);
      return normalizedUrl === baseRoute || normalizedUrl.startsWith(baseRoute + '/');
    }
    return normalizedUrl === route;
  });
};

const getRedisConfig = (): RedisOptions => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

export const createRedisClient = (): Redis => new Redis(getRedisConfig());

// Create shared Redis instance
export const redis = createRedisClient();

export async function setupRedis(server: FastifyInstance) {
  try {
    logger.info('Creating Redis client with config:', {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || '6379',
      db: process.env.REDIS_DB || '0'
    });

    const redisClient = new Redis(getRedisConfig());

    // Test the connection
    await redisClient.ping();
    logger.info('Redis connection test successful');

    // Register Redis instance with Fastify
    await server.register(fastifyRedis, {
      client: redisClient,
      closeClient: true,
    });
    logger.info('Redis plugin registered with Fastify');

    // Setup Redis-based middleware
    try {
      const rateLimiter = createRateLimiter(redisClient, {
        keyPrefix: 'ratelimit:api:',
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
      } as RateLimitConfig);

      const sessionMiddleware = createSessionMiddleware(redisClient);
      const otpManager = createOTPManager(redisClient);
      const cacheManager = createCacheManager(redisClient);

      logger.info('Redis middleware components initialized');

      // Register middleware globally with path exclusions
      server.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
        if (isPublicRoute(request.url)) {
          return;
        }
        return rateLimiter(request, reply);
      });

      server.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
        if (isPublicRoute(request.url)) {
          return;
        }
        return sessionMiddleware(request, reply);
      });

      // Make utilities available through decorators
      server.decorate('otpManager', otpManager);
      server.decorate('cacheManager', cacheManager);

      server.addHook('onClose', async () => {
        await redisClient.quit();
      });

      logger.info('Redis setup completed successfully');
    } catch (middlewareError) {
      logger.error('Failed to initialize Redis middleware:', {
        error: middlewareError instanceof Error ? middlewareError.message : String(middlewareError)
      });
      throw middlewareError;
    }
  } catch (error) {
    logger.error('Redis setup failed:', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw new Error(`Redis setup failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
