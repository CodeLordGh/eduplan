export * from './auth.middleware';
export * from './types';
export {
  setRedisValue,
  getRedisValue,
  deleteRedisValue,
  incrementRedisValue,
  setRedisExpiry,
  getRedisTimeToLive,
  createSessionKey,
  createRateLimitKey,
  createOTPKey,
  createCacheKey,
  parseJSON,
  getHeaderValue
} from './redis/utils';

// Export Redis middleware utilities
export * from './redis/session';
export * from './redis/rate-limit';
export * from './redis/otp';
export * from './redis/cache';
export * from './redis/types';

export { authenticate, authorize, AuthenticatedUser, RequestWithUser } from './auth.middleware';