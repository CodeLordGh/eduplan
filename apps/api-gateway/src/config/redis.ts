import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyRedis from '@fastify/redis';
import Redis from 'ioredis';
import { 
  createRateLimiter,
  createOTPManager,
  createSessionMiddleware,
  createCacheManager
} from '@eduflow/middleware';

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
  '/favicon.ico'
];

const isPublicRoute = (url: string) => {
  // Normalize URL by removing query parameters
  const normalizedUrl = url.split('?')[0];
  
  return PUBLIC_ROUTES.some(route => {
    if (route.endsWith('/*')) {
      const baseRoute = route.slice(0, -2);
      return normalizedUrl === baseRoute || normalizedUrl.startsWith(baseRoute + '/');
    }
    return normalizedUrl === route;
  });
};

export async function setupRedis(server: FastifyInstance) {
  const redisClient = new Redis();

  // Register Redis instance with Fastify
  await server.register(fastifyRedis, {
    client: redisClient,
    closeClient: true
  });

  // Setup Redis-based middleware
  const rateLimiter = createRateLimiter(redisClient, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  });

  const sessionMiddleware = createSessionMiddleware(redisClient);
  const otpManager = createOTPManager(redisClient);
  const cacheManager = createCacheManager(redisClient);

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
} 