// Export auth middleware
export {
  authenticate,
  authorize,
  type AuthenticatedUser,
  type RequestWithUser,
} from './auth.middleware';

// Export Redis core functionality
export {
  createRedisClient,
  getRedisClient,
  type RedisConfig,
} from './redis/client';

// Export Redis middleware
export { createSessionMiddleware } from './redis/session';
export { createRateLimiter } from './redis/rate-limit';
export { createOTPManager } from './redis/otp';
export { createCacheManager } from './redis/cache';

// Export Redis utilities
export {
  createSessionKey,
  createRateLimitKey,
  createOTPKey,
  createCacheKey,
  parseJSON,
  getRedisValue,
  setRedisValue,
  incrementRedisValue,
  setRedisExpiry,
  getRedisTimeToLive,
  deleteRedisValue,
} from './redis/utils';

// Export Redis response handlers
export {
  sendUnauthorized,
  sendTooManyRequests,
  setRateLimitHeaders,
} from './redis/response';

// Export Redis types
export type {
  SessionData,
  RateLimitConfig,
  OTPData,
  CacheConfig,
} from './redis/types';

// Export ABAC middleware
export * from './abac';

// Export common types
export * from './types';

// Export validation
export * from './validation';
