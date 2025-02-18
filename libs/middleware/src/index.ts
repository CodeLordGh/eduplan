export * from './auth.middleware';
export * from './types';

// Export Redis utilities and middleware
export {
  // Types
  SessionData,
  RateLimitConfig,
  OTPData,
  CacheConfig,
} from './redis/types';

export {
  // Utilities
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

export {
  // Response handlers
  sendUnauthorized,
  sendTooManyRequests,
  setRateLimitHeaders,
} from './redis/response';

export {
  // Middleware factories
  createSessionMiddleware,
} from './redis/session';

export {
  createRateLimiter,
} from './redis/rate-limit';

export {
  createOTPManager,
} from './redis/otp';

export {
  createCacheManager,
} from './redis/cache';

// Export auth middleware
export { authenticate, authorize, AuthenticatedUser, RequestWithUser } from './auth.middleware';

// Export other middleware
export * from './abac';

export * from './validation';
