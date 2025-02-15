export * from './auth.middleware';
export * from './types';
export {
  getRedisClient,
  createRedisClient,
  RedisConfig,
  getRedisValue,
  setRedisValue,
  incrementRedisValue,
  setRedisExpiry,
  getRedisTimeToLive,
  deleteRedisValue,
  createSessionKey,
  createRateLimitKey,
  createOTPKey,
  createCacheKey,
  parseJSON,
} from './redis';

// Export Redis middleware utilities
export * from './redis/session';
export * from './redis/rate-limit';
export * from './redis/otp';
export * from './redis/cache';
export * from './redis/types';

export { authenticate, authorize, AuthenticatedUser, RequestWithUser } from './auth.middleware';

// Export rate limiter
export { createRateLimiter, RateLimitConfig } from './rate-limiter';

// Export OTP manager
export { createOTPManager } from './otp';

// Export other middleware
export * from './abac';
export * from './redis';
export * from './validation';
