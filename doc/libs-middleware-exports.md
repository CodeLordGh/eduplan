# Exports from libs/middleware

## index.ts

- Re-exports from various modules including `auth.middleware`, `types`, `redis`, `abac`, and `validation`.
- `authenticate`, `authorize`, `AuthenticatedUser`, `RequestWithUser` from `auth.middleware`.
- `createRateLimiter`, `RateLimitConfig` from `rate-limiter`.
- `createOTPManager` from `otp`.
- All Redis utilities and types from the Redis module.

## auth.middleware.ts

- `extractToken(request: FastifyRequest): string`
  - Extracts JWT token from request headers.
  - Throws if no token is provided.

- `verifyAndAttachUser(request: FastifyRequest): Promise<RequestWithUser>`
  - Verifies JWT token and attaches user to request.
  - Throws on invalid token.

- `authenticate(request: FastifyRequest): Promise<RequestWithUser>`
  - Wrapper around verifyAndAttachUser for authentication.

- `checkRole(allowedRoles: UserRole[]): (user: AuthenticatedUser) => void`
  - Role validation function.
  - Throws if user's role is not in allowed roles.

- `authorize(roles: UserRole[]): (request: FastifyRequest) => Promise<void>`
  - Combines authentication and role checking.
  - Returns middleware function for route protection.

## redis/client.ts

- `RedisConfig`
  - Interface for Redis client configuration.
  - Properties: host, port, password?, db?, keyPrefix?

- `createRedisClient(config?: Partial<RedisConfig>): TaskEither<AppError, Redis>`
  - Creates a new Redis client instance with provided or default config.
  - Returns a TaskEither with the Redis client or an error.

- `getRedisClient(): TaskEither<AppError, Redis>`
  - Gets or creates a singleton Redis client instance.
  - Returns a TaskEither with the Redis client or an error.

## redis/utils.ts

- `createSessionKey(sessionId: string): string`
  - Generates Redis key for session storage.

- `createRateLimitKey(ip: string, prefix = 'ratelimit:'): string`
  - Generates Redis key for rate limiting.

- `createOTPKey(userId: string): string`
  - Generates Redis key for OTP storage.

- `createCacheKey(key: string, prefix = 'cache:'): string`
  - Generates Redis key for general caching.

- `parseJSON<T>(data: string): Option<T>`
  - Safely parses JSON string to type T.

- `getRedisValue(redis: Redis): (key: string) => TaskEither<AppError, Option<string>>`
  - Retrieves value from Redis.

- `setRedisValue(redis: Redis): (key: string, value: string, ttl?: number) => TaskEither<AppError, boolean>`
  - Sets value in Redis with optional TTL.

- `incrementRedisValue(redis: Redis): (key: string) => TaskEither<AppError, number>`
  - Increments numeric value in Redis.

- `setRedisExpiry(redis: Redis): (key: string, ttl: number) => TaskEither<AppError, boolean>`
  - Sets expiry on existing key.

- `getRedisTimeToLive(redis: Redis): (key: string) => TaskEither<AppError, number>`
  - Gets remaining TTL for key.

- `deleteRedisValue(redis: Redis): (key: string) => TaskEither<AppError, boolean>`
  - Deletes value from Redis.

## redis/session.ts

- `createSessionMiddleware(redis: Redis): (request: FastifyRequest, reply: FastifyReply) => Promise<void>`
  - Creates middleware for session management.
  - Validates session ID from headers and attaches session data to request.
  - Sends unauthorized response if session is invalid.

## redis/cache.ts

- `CacheConfig`
  - Interface for cache configuration.
  - Properties: ttl?: number, prefix?: string

- `createCacheManager(redis: Redis)`
  - Creates a cache manager with get, set, and delete operations.
  - Methods:
    - `get<T>(key: string, prefix?: string): TaskEither<Error, Option<T>>`
    - `set<T>(key: string, data: T, config: CacheConfig): TaskEither<Error, boolean>`
    - `delete(key: string, prefix?: string): TaskEither<Error, boolean>`

## rate-limiter.ts

- `RateLimitConfig`
  - Interface for rate limiter configuration.
  - Properties: keyPrefix: string, windowMs: number, max: number

- `createRateLimiter(redis: Redis, config: RateLimitConfig)`
  - Creates a rate limiter middleware function.
  - Limits requests based on IP and configuration.

## otp.ts

- `createOTPManager(redis: Redis)`
  - Creates an OTP manager with store, verify, and clear functions.
  - Manages OTP lifecycle in Redis. 