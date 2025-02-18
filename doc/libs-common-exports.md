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