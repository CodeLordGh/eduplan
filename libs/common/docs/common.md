# Common Library Documentation

This document provides a comprehensive overview of all functions and utilities exported from the common library.

## Table of Contents
- [Security](#security)
  - [ABAC (Attribute Based Access Control)](#abac-attribute-based-access-control)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Logging](#logging)
- [User Management](#user-management)
- [Validation](#validation)

## Security

Located in `src/security.ts`, this module provides comprehensive security utilities.

### Types

- `JWTPayload`
  ```typescript
  interface JWTPayload {
    userId: string;
    email: string;
    role: Role;
    permissions: Permission[];
  }
  ```

### Password Security
- `hashPassword(password: string): Promise<string>`
  - Hashes passwords using Argon2id
  - Uses secure memory and time cost parameters
  - Returns a secure hash string
  
- `verifyPassword(hash: string, password: string): Promise<boolean>`
  - Verifies a password against its hash
  - Uses constant-time comparison
  - Returns true if password matches

### JWT Management
- `generateJWT(payload: JWTPayload): string`
  - Generates a JWT token
  - Uses configurable secret and expiration
  - Default expiration: 15 minutes
  
- `verifyJWT(token: string): JWTPayload`
  - Verifies and decodes a JWT token
  - Returns the payload if valid
  - Throws if token is invalid/expired
  
- `generateRefreshToken(): string`
  - Generates a secure refresh token
  - Uses cryptographic random bytes
  - Returns a 40-byte hex string

### OTP and Token Management
- `generateOTP(): string`
  - Generates an 8-digit OTP
  - Uses cryptographic random numbers
  - Returns a zero-padded string
  
- `encryptToken(token: string): string`
  - Encrypts tokens using AES-256-CBC
  - Uses random IV for each encryption
  - Returns IV:encrypted format
  
- `decryptToken(encryptedToken: string): string`
  - Decrypts AES-256-CBC encrypted tokens
  - Handles IV:encrypted format
  - Returns original token string

### Authorization
- `hasPermission(userPermissions: Permission[], requiredPermission: Permission): boolean`
  - Checks if user has specific permission
  - Simple array inclusion check
  - Returns true if permission exists
  
- `isRoleAuthorized(userRole: Role, requiredRole: Role, roleHierarchy: Record<Role, Role[]>): boolean`
  - Checks role authorization
  - Supports role hierarchy
  - Returns true if role is authorized

### Security Headers
- `getSecurityHeaders(): Record<string, string>`
  Returns secure HTTP headers:
  - Strict-Transport-Security
  - X-Frame-Options
  - X-Content-Type-Options
  - X-XSS-Protection
  - Content-Security-Policy
  - Referrer-Policy

### Configuration
The module uses environment variables for configuration:
- `JWT_SECRET`: Secret key for JWT signing
- `JWT_EXPIRES_IN`: JWT expiration time (default: '15m')
- `REFRESH_TOKEN_EXPIRES_IN`: Refresh token expiration (default: '7d')
- `ENCRYPTION_KEY`: Key for token encryption

### Usage Example
```typescript
// Password handling
const hash = await hashPassword('secure123');
const isValid = await verifyPassword(hash, 'secure123');

// JWT operations
const token = generateJWT({
  userId: '123',
  email: 'user@example.com',
  role: 'USER',
  permissions: ['READ', 'WRITE']
});
const payload = verifyJWT(token);

// Token encryption
const encrypted = encryptToken(refreshToken);
const decrypted = decryptToken(encrypted);

// Authorization
const canAccess = hasPermission(user.permissions, 'ADMIN_ACCESS');
const isAuthorized = isRoleAuthorized(user.role, 'ADMIN', roleHierarchy);

// Security headers
app.use((req, res, next) => {
  const headers = getSecurityHeaders();
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  next();
});
```

### ABAC (Attribute Based Access Control)

Located in `src/security/abac.ts`, this module provides attribute-based access control functionality.

#### Exports

##### Core Functions
- `validateAccess(user: UserAttributes, policy: AccessPolicy, context?: Record<string, any>): ValidationResult`
  - Main validation function to check if a user has access based on policy
  - Validates roles, verification status, school context, environment conditions, and custom conditions
  - Returns `{ granted: boolean, reason?: string }`
  
- `createPolicy(resource: string, action: AccessPolicy['action'], conditions: PolicyConditions): AccessPolicy`
  - Creates a new access policy for a resource
  - Combines resource name, action type, and policy conditions into a single policy object
  
- `createAbacMiddleware(policy: AccessPolicy): (req: any, res: any, next: any) => Promise<void>`
  - Creates a Fastify middleware for ABAC validation
  - Automatically validates requests against the provided policy
  - Throws a FORBIDDEN error with status 403 if access is denied

##### Internal Validation Functions
- `validateRoles(user: UserAttributes, conditions: PolicyConditions): Either<string, true>`
  - Validates user roles against policy conditions
  - Checks both global roles and school-specific roles
  - Supports `anyOf` and `allOf` role combinations
  
- `validateVerification(user: UserAttributes, conditions: PolicyConditions): Either<string, true>`
  - Validates user verification status
  - Checks KYC status, employment status, and officer permissions
  - Supports required KYC verification and specific status requirements
  
- `validateSchoolContext(user: UserAttributes, conditions: PolicyConditions): Either<string, true>`
  - Validates school-related conditions
  - Checks school association, ownership status, and school-specific roles
  - Supports current school context validation
  
- `validateEnvironment(user: UserAttributes, conditions: PolicyConditions): Either<string, true>`
  - Validates environmental conditions
  - Handles IP restrictions (allowlist/denylist)
  - Validates time-based access restrictions
  - Checks device type restrictions
  - Validates location-based restrictions (countries/regions)
  
- `validateCustomConditions(user: UserAttributes, conditions: PolicyConditions, context: Record<string, any>): Either<string, true>`
  - Validates custom policy conditions
  - Executes custom evaluator functions
  - Supports context-aware validation

## Authentication

Located in `src/auth.ts`, this module provides authentication utilities using argon2 for password hashing and JWT for token management.

### Exports

- `async hashPassword(password: string): Promise<string>`
  - Hashes a password using argon2
  - Returns a secure hash that can be stored in the database
  - Uses argon2's default secure settings
  
- `async verifyPassword(password: string, hash: string): Promise<boolean>`
  - Verifies a password against its hash using argon2
  - Returns true if the password matches the hash, false otherwise
  - Safe against timing attacks
  
- `generateJWT(payload: object): string`
  - Generates a JWT token with a 15-minute expiration
  - Uses environment variable JWT_SECRET or fallback secret key
  - Automatically includes expiration time in the token
  
- `verifyJWT<T>(token: string): T`
  - Verifies and decodes a JWT token
  - Returns the decoded payload typed as T
  - Throws if token is invalid or expired
  - Uses same JWT_SECRET as generateJWT

## Error Handling

Located in `src/errors/`, this module provides comprehensive error handling utilities.

### Exports

#### Core Error Functions
- `createError(message: string, code: string, statusCode: number, originalError?: unknown): Error & { code: string; statusCode: number }`
  - Creates a generic error with code and status
  - Preserves original error stack trace if provided
  - Returns an enhanced Error object with code and statusCode properties
  
- `errorHandler(logger: Logger, error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply): void`
  - Global error handler for Fastify applications
  - Automatically logs errors with request context
  - Handles both known (AppError) and unknown errors
  - Returns appropriate error responses with correct status codes

#### Error Creation Utilities
- `createAppError(details: ErrorDetails): AppError`
  - Creates an application error with standardized structure
  - Automatically maps error codes to HTTP status codes
  - Supports error metadata and cause tracking
  
- `throwError(details: ErrorDetails): never`
  - Helper function to throw AppErrors
  - Creates and throws an AppError in one step
  - Useful for immediate error throwing scenarios
  
- `createErrorResponse(error: AppError): ErrorResponse`
  - Creates a standardized error response object
  - Used by error handler to format error responses
  - Ensures consistent error response structure

#### Error Types and Constants
Exports various error types and utilities from:
- `base.error.ts`
  - Base error creation utilities
  - HTTP status code mappings
  - Core error interfaces
- `auth.error.ts`
  - Authentication and authorization errors
  - JWT and session-related errors
- `file.error.ts`
  - File handling specific errors
  - Upload, download, and storage errors
- `utils.ts`
  - Error utility functions
  - Error type guards and checks

### Error Codes and Status Mappings
The following error codes are supported with their corresponding HTTP status codes:
- AUTH_ERROR: 401
- UNAUTHORIZED: 403
- FORBIDDEN: 403
- NOT_FOUND: 404
- VALIDATION_ERROR: 400
- INTERNAL_SERVER_ERROR: 500
- BAD_REQUEST: 400
- CONFLICT: 409
- SERVICE_UNAVAILABLE: 503
- FILE_SIZE_ERROR: 413
- FILE_TYPE_ERROR: 415
- FILE_QUOTA_ERROR: 507
- FILE_ACCESS_ERROR: 403
- FILE_NOT_FOUND: 404

## Logging

Located in `src/logger/index.ts`, this module provides logging utilities built on top of Pino.

### Exports

#### Types
- `LogContext = Record<string, unknown>`
  - Type for structured logging context
  - Allows any key-value pairs for additional log data
  
- `LogLevel = 'info' | 'error' | 'warn' | 'debug' | 'trace'`
  - Available log levels
  - Matches Pino's log levels

#### Functions
- `createLogger(service: string, options?: pino.LoggerOptions)`
  Creates a logger instance with the following methods:
  - `info(message: string, context?: LogContext)`
    - Logs informational messages
    - Accepts optional structured context
  
  - `error(message: string, error?: Error, context?: LogContext)`
    - Logs error messages
    - Automatically formats Error objects
    - Includes stack traces when available
  
  - `warn(message: string, context?: LogContext)`
    - Logs warning messages
    - Useful for non-critical issues
  
  - `debug(message: string, context?: LogContext)`
    - Logs debug messages
    - Only enabled when LOG_LEVEL is 'debug' or lower
  
  - `trace(message: string, context?: LogContext)`
    - Logs trace messages
    - Most verbose logging level
    - Only enabled when LOG_LEVEL is 'trace'

### Features
- Built on Pino for high performance
- Structured logging by default
- Automatic timestamp in ISO format
- Service name included in all logs
- Configurable log level via LOG_LEVEL environment variable
- Error formatting with stack traces
- Context support for all log levels
- Type-safe logging interface

### Configuration
The logger can be configured through:
- Environment variables:
  - `LOG_LEVEL`: Sets the minimum log level (default: 'info')
- Options parameter:
  - Accepts all Pino logger options
  - Can override default formatters and settings

### Usage Example
```typescript
const logger = createLogger('my-service');

// Basic logging
logger.info('Server started');

// With context
logger.info('Request received', { method: 'GET', path: '/api/users' });

// Error logging
try {
  // ... some code
} catch (error) {
  logger.error('Failed to process request', error, { userId: '123' });
}
```

## User Management

Located in `src/user/`, this module provides user management functionality.

### Exports

#### Types
From `types.ts`:
- `User`
- `CreateUserInput`
- `UpdateUserInput`
- `UserRepository`

#### Core Functions
- `validateCreateUserInput(input: CreateUserInput): TaskEither<AppError, CreateUserInput>`
  - Validates user creation input
  
- `validateUpdateUserInput(input: UpdateUserInput): TaskEither<AppError, UpdateUserInput>`
  - Validates user update input
  
- `createUserService(repository: UserRepository)`
  Creates a user service with methods:
  - Create user
  - Update user
  - Delete user
  - Find user
  - Validate user credentials

### Usage

The user service is built using functional programming principles with `fp-ts`, providing type-safe error handling and composition.

## Validation

Located in `src/validation/index.ts`, this module provides common validation utilities.

### Exports

- `validateEmail(email: string): boolean`
  - Validates email format using standard regex pattern
  - Checks for:
    - Valid local part (before @)
    - Valid domain part
    - Valid TLD (2 or more characters)
  - Returns true if email is valid
  
- `validatePassword(password: string): boolean`
  - Validates password strength requirements
  - Checks for:
    - Minimum length of 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    - At least one special character (!@#$%^&*(),.?":{}|<>)
  - Returns true if password meets all requirements

### Usage Example
```typescript
// Email validation
const isValidEmail = validateEmail('user@example.com'); // true
const isInvalidEmail = validateEmail('invalid-email'); // false

// Password validation
const isValidPassword = validatePassword('SecurePass123!'); // true
const isInvalidPassword = validatePassword('weak'); // false
```
