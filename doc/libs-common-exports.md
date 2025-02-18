# Exports from libs/common

## security.ts

- `hashPassword(password: string): Promise<string>`
  - Hashes a password using bcrypt with 10 salt rounds.
  - Returns a promise that resolves to the hashed password.

- `verifyPassword(hash: string, password: string): Promise<boolean>`
  - Compares a password with a hash using bcrypt.
  - Returns a promise that resolves to true if the password matches the hash.

- `generateJWT(payload: JWTPayload): string`
  - Generates a JWT token with a secret and expiration from config.
  - Returns the JWT token as a string.

- `generateRefreshToken(): string`
  - Generates a secure refresh token using random bytes.
  - Returns the token as a 40-byte hex string.

- `verifyJWT(token: string): JWTPayload`
  - Verifies a JWT token using a secret from config.
  - Returns the decoded payload if valid.

## auth.ts

- `async hashPassword(password: string): Promise<string>`
  - Hashes a password using bcrypt with 10 salt rounds.
  - Returns a promise that resolves to the hashed password.

- `async verifyPassword(password: string, hash: string): Promise<boolean>`
  - Compares a password with a hash using bcrypt.
  - Returns a promise that resolves to true if the password matches the hash.

- `generateJWT(payload: object): string`
  - Generates a JWT token with a secret and expiration.
  - Returns the JWT token as a string.

- `verifyJWT<T>(token: string): T`
  - Verifies a JWT token using a secret.
  - Returns the decoded payload typed as T.

## errors/auth.error.ts

- `createAuthenticationError(message: string, cause?: unknown, metadata?: Record<string, unknown>): never`
  - Creates and throws an authentication error.

- `createInvalidCredentialsError(cause?: unknown, metadata?: Record<string, unknown>): never`
  - Creates and throws an invalid credentials error.

- `createTokenExpiredError(cause?: unknown, metadata?: Record<string, unknown>): never`
  - Creates and throws a token expired error.

- `createInvalidTokenError(cause?: unknown, metadata?: Record<string, unknown>): never`
  - Creates and throws an invalid token error.

- `createUnauthorizedError(message: string, cause?: unknown, metadata?: Record<string, unknown>): never`
  - Creates and throws an unauthorized error.

- `createForbiddenError(message: string, cause?: unknown, metadata?: Record<string, unknown>): never`
  - Creates and throws a forbidden error with FORBIDDEN code.

- `createOTPError(message: string, cause?: unknown, metadata?: Record<string, unknown>): never`
  - Creates and throws an OTP-related authentication error.

- `createOTPExpiredError(cause?: unknown, metadata?: Record<string, unknown>): never`
  - Creates and throws an error for expired OTP.

- `createInvalidOTPError(cause?: unknown, metadata?: Record<string, unknown>): never`
  - Creates and throws an error for invalid OTP.

## errors/base.error.ts

- `class BaseError extends Error`
  - Base error class with cause tracking.
  - Constructor: `constructor(name: string, message: string, cause?: unknown)`

- `createAppError(details: ErrorDetails): AppError`
  - Creates an application error with appropriate status code.
  - Returns structured error object.

- `throwError(details: ErrorDetails): never`
  - Creates and throws an application error.

- `createErrorResponse(error: AppError): ErrorResponse`
  - Wraps an error in the standard error response format.

## errors/file.error.ts

- `createFileSizeError(message: string, cause?: unknown, metadata?: Record<string, unknown>): never`
  - Creates and throws an error when file size limits are exceeded.
  - Returns never as it always throws.

- `createFileTypeError(message: string, cause?: unknown, metadata?: Record<string, unknown>): never`
  - Creates and throws an error when file type is not supported.
  - Returns never as it always throws.

- `createFileQuotaError(message: string, cause?: unknown, metadata?: Record<string, unknown>): never`
  - Creates and throws an error when storage quota is exceeded.
  - Returns never as it always throws.

- `createFileAccessError(message: string, cause?: unknown, metadata?: Record<string, unknown>): never`
  - Creates and throws an error when file access is denied.
  - Returns never as it always throws.

- `createFileNotFoundError(message: string, cause?: unknown, metadata?: Record<string, unknown>): never`
  - Creates and throws an error when file is not found.
  - Returns never as it always throws.

## errors/utils.ts

- `combineErrors(errors: AppError[]): AppError`
  - Combines multiple errors into a single validation error.
  - Returns a combined AppError with all error details.

- `withRequestContext(request: FastifyRequest): (error: AppError) => AppError`
  - Enriches error with request context for better logging.
  - Returns a function that adds request context to errors.

- `enrichError<C extends ErrorCode>(metadata: Partial<ErrorMetadata[C]>): (error: AppError & { code: C }) => AppError`
  - Adds additional metadata to an existing error.
  - Returns a function that enriches errors with metadata.

- `mapError<T>(mapper: (error: AppError) => AppError): (te: TaskEither<AppError, T>) => TaskEither<AppError, T>`
  - Maps one error type to another in a TaskEither context.
  - Returns a function for error transformation.

- `withFallback<T>(fallback: T): (te: TaskEither<Error, T>) => TaskEither<never, T>`
  - Provides a fallback value for TaskEither operations.
  - Returns a function that ensures a successful result.

- `createLoggedError(request: FastifyRequest): <T>(operation: string) => (error: AppError) => TaskEither<AppError, T>`
  - Creates a logged error with request context.
  - Returns a function for creating logged errors.

- `loggedError<T>(operation: string): (error: AppError) => TaskEither<AppError, T>`
  - Logs an error and continues with the error chain.
  - Returns a function for error logging.

- `recoverFromCategory<T>(category: ErrorCategory, recovery: (error: AppError) => TaskEither<AppError, T>)`
  - Provides type-safe error recovery based on error category.
  - Returns a function for category-based error recovery.

- `ensureFound<T>(resourceType: string, resourceId: string): (option: Option<T>) => Either<AppError, T>`
  - Ensures an Option resolves to a value or returns a NotFound error.
  - Returns a function for Option resolution.

- `getErrorMetadata<C extends ErrorCode>(error: AppError, code: C): Option<ErrorMetadata[C]>`
  - Type-safe error metadata accessor.
  - Returns an Option containing error metadata.

- `createFieldValidationError(field: string, value: unknown, constraint: string, additionalFields?: Record<string, unknown>): AppError`
  - Creates a validation error for a specific field.
  - Returns a structured validation error.

## errors/index.ts

- `errorHandler(logger: Logger, error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply): FastifyReply`
  - Global error handler for Fastify applications.
  - Logs errors with appropriate context using the provided logger.
  - Handles both known (AppError) and unknown errors.
  - Returns a formatted error response with correct status code.
  - Usage: `app.setErrorHandler((error, request, reply) => errorHandler(logger, error, request, reply));`

- `createError(message: string, code: string, statusCode: number, originalError?: unknown): Error & { code: string; statusCode: number }`
  - Creates a generic error with code and status code.
  - Preserves stack trace from original error if provided.

## user/index.ts

- `validateCreateUserInput(input: CreateUserInput): TaskEither<AppError, CreateUserInput>`
  - Validates user creation input.
  - Returns a TaskEither resolving to the input or an AppError.

- `validateUpdateUserInput(input: UpdateUserInput): TaskEither<AppError, UpdateUserInput>`
  - Validates user update input.
  - Returns a TaskEither resolving to the input or an AppError.

## validation/user.ts

- `validateEmail(email: string): boolean`
  - Validates an email string against a schema.
  - Returns true if valid.

- `validatePassword(password: string): boolean`
  - Validates a password string against a schema.
  - Returns true if valid.

- `emailSchema`
  - Zod schema for validating email format.

- `passwordSchema`
  - Zod schema for validating password format.

## security/abac.ts

- `validateAccess(user: UserAttributes, policy: AccessPolicy, context: Record<string, any>): ValidationResult`
  - Validates user access against a policy with context.
  - Returns validation result with granted status and reason.

- `createPolicy(resource: string, action: AccessPolicy['action'], conditions: PolicyConditions): AccessPolicy`
  - Creates an ABAC policy with specified resource, action, and conditions.
  - Returns configured access policy.

- `createAbacMiddleware(policy: AccessPolicy): (req: any, res: any, next: any) => Promise<void>`
  - Creates Express/Fastify middleware for ABAC policy enforcement.
  - Returns middleware function.

## security/policies.ts

- `updateSchoolSettingsPolicy: AccessPolicy`
  - Policy for updating school settings.
  - Requires SCHOOL_OWNER or SCHOOL_HEAD role.

- `verifyKycDocumentPolicy: AccessPolicy`
  - Policy for KYC document verification.
  - Requires SYSTEM_ADMIN role and approval authority.

- `viewStudentGradesPolicy: AccessPolicy`
  - Policy for viewing student grades.
  - Accessible by TEACHER, SCHOOL_HEAD, or PARENT roles.

- `createKYCPolicy(action: AccessPolicy['action']): AccessPolicy`
  - Creates KYC-related access policy.
  - Configurable by action type.

- `createDocumentPolicy(action: AccessPolicy['action']): AccessPolicy`
  - Creates document management policy.
  - Configurable by action type.

- `createSchoolPolicy(action: AccessPolicy['action']): AccessPolicy`
  - Creates school management policy.
  - Configurable by action type.

- `createEmploymentPolicy(action: AccessPolicy['action']): AccessPolicy`
  - Creates employment-related policy.
  - Configurable by action type.

## user/transforms.ts

- `type UserWithIncludes`
  - Extended Prisma User type with profile, documents, and verifications includes.
  - Also includes roles and permissions arrays.

- `interface RequestContext`
  - Type for request context with location and device info.
  - Used for enriching user attributes.

- `transformKYCAttributes(user: UserWithIncludes): { status: KYCStatus; officerStatus?: KYCOfficerStatus }`
  - Transforms user data into KYC attributes.
  - Returns KYC status and officer status if applicable.

- `transformEmploymentAttributes(user: UserWithIncludes): { status: EmploymentEligibilityStatus; verifiedAt?: Date; verifiedBy?: string; documentIds: string[]; currentSchools: string[] }`
  - Transforms user data into employment attributes.
  - Returns employment status and related verification data.

- `transformAccessAttributes(userId: string, getAccessData: (userId: string) => Promise<any>): Promise<{ failedAttempts: number; lastLogin?: Date; lockedUntil?: Date; mfaEnabled: boolean; mfaVerified: boolean }>`
  - Transforms user access data.
  - Returns access control attributes.

- `transformContextAttributes(user: UserWithIncludes, requestContext?: RequestContext, getCurrentSchoolId?: (userId: string) => Promise<string | undefined>): Promise<UserContext>`
  - Transforms request context into user context.
  - Returns context attributes including current school and device info.

- `transformToUserAttributes(user: UserWithIncludes, options?: { requestContext?: RequestContext; getAccessData?: Function; getCurrentSchoolId?: Function; getSchoolRoles?: Function }): Promise<UserAttributes>`
  - Main transform function that combines all attribute transformations.
  - Returns complete user attributes object.

## resilience/circuit-breaker.ts

- `interface CircuitBreakerOptions`
  - Configuration options for circuit breaker.
  - Includes timeout, error threshold, reset timeout, and monitor interval.

- `interface CircuitBreakerState`
  - State interface for circuit breaker.
  - Tracks failures, last failure time, and current status.

- `createCircuitBreaker(options: CircuitBreakerOptions, logger: Logger): { wrap: <T>(operation: () => Promise<T>) => TaskEither<Error, T>; getState: () => CircuitBreakerState }`
  - Creates a circuit breaker instance.
  - Returns functions to wrap operations and get current state.

## resilience/batch-processor.ts

- `interface BatchProcessorOptions`
  - Configuration options for batch processor.
  - Includes batch size, flush interval, max retries, and retry delay.

- `interface BatchItem<T>`
  - Type for items to be processed in batch.
  - Includes exchange, routing key, content, and headers.

- `createBatchProcessor<T>(channel: ConfirmChannel, options: BatchProcessorOptions, logger: Logger): { add: (item: BatchItem<T>) => Promise<void>; close: () => Promise<void> }`
  - Creates a batch processor instance.
  - Returns functions to add items and close the processor.

## resilience/redis-pool.ts

- `interface RedisPoolOptions`
  - Configuration options for Redis connection pool.
  - Includes nodes, max/min connections, and timeout settings.

- `interface RedisPoolState`
  - State interface for Redis pool.
  - Tracks available clients, in-use clients, and waiting operations.

- `createRedisPool(options: RedisPoolOptions, logger: Logger): { init: () => Promise<void>; withClient: <T>(operation: (client: Redis) => Promise<T>) => Promise<T>; close: () => Promise<void> }`
  - Creates a Redis connection pool.
  - Returns functions to initialize, use clients, and close the pool. 