# Middleware Library Documentation

This document provides a comprehensive overview of all functions and utilities exported from the middleware library.

## Table of Contents

- [Authentication Middleware](#authentication-middleware)
- [Redis Utilities](#redis-utilities)
  - [Key Generation](#key-generation)
  - [Data Operations](#data-operations)
- [Academic Middleware](#academic-middleware)

## Authentication Middleware

Located in `src/auth.middleware.ts`, this module provides authentication and authorization utilities.

### Types

- `AuthenticatedUser`

  ```typescript
  {
    id: string;
    email: string;
    role: UserRole;
  }
  ```

- `RequestWithUser`
  - Extends FastifyRequest with authenticated user data

### Exports

- `extractToken(request: FastifyRequest): string`

  - Extracts JWT token from request headers
  - Throws if no token is provided

- `verifyAndAttachUser(request: FastifyRequest): Promise<RequestWithUser>`

  - Verifies JWT token and attaches user to request
  - Throws on invalid token

- `authenticate(request: FastifyRequest): Promise<RequestWithUser>`

  - Wrapper around verifyAndAttachUser for authentication

- `checkRole(allowedRoles: UserRole[]): (user: AuthenticatedUser) => void`

  - Role validation function
  - Throws if user's role is not in allowed roles

- `authorize(roles: UserRole[]): (request: FastifyRequest) => Promise<void>`
  - Combines authentication and role checking
  - Returns middleware function for route protection

## Redis Utilities

Located in `src/redis/`, this module provides Redis-related utilities and middleware.

### Key Generation Functions

- `createSessionKey(sessionId: string): string`
  - Generates Redis key for session storage
- `createRateLimitKey(ip: string, prefix?: string): string`
  - Generates Redis key for rate limiting
- `createOTPKey(userId: string): string`
  - Generates Redis key for OTP storage
- `createCacheKey(key: string, prefix?: string): string`
  - Generates Redis key for general caching

### Data Operations

- `parseJSON<T>(data: string): Option<T>`
  - Safely parses JSON string to type T
- `getHeaderValue(headers: IncomingHttpHeaders, key: string): Option<string>`
  - Safely extracts header value

### Redis Operations

All operations return TaskEither for functional error handling:

- `getRedisValue(redis: Redis): (key: string) => TaskEither<Error, Option<string>>`
  - Retrieves value from Redis
- `setRedisValue(redis: Redis): (key: string, value: string, ttl?: number) => TaskEither<Error, boolean>`
  - Sets value in Redis with optional TTL
- `incrementRedisValue(redis: Redis): (key: string) => TaskEither<Error, number>`
  - Increments numeric value in Redis
- `setRedisExpiry(redis: Redis): (key: string, ttl: number) => TaskEither<Error, boolean>`
  - Sets expiry on existing key
- `getRedisTimeToLive(redis: Redis): (key: string) => TaskEither<Error, number>`
  - Gets remaining TTL for key
- `deleteRedisValue(redis: Redis): (key: string) => TaskEither<Error, boolean>`
  - Deletes value from Redis

## Academic Middleware

Located in `src/academic.ts`, this module provides academic-related middleware functions.

### Types

- `DatabaseRequest`
  - Extends FastifyRequest with database and user context

### Exports

- `reportCardAccessGuard(request: DatabaseRequest, reply: FastifyReply): Promise<void>`

  - Guards report card access based on user role and permissions
  - Validates:
    - Report card existence
    - Staff access rights
    - Parent access rights
    - Report card availability

- `gradeRecordingGuard(request: DatabaseRequest, reply: FastifyReply): Promise<void>`

  - Guards grade recording operations
  - Validates:
    - Teacher assignment to subject
    - Grade recording permissions
    - School context

- `reportCardPrintGuard(request: DatabaseRequest, reply: FastifyReply): Promise<void>`
  - Guards report card printing operations
  - Validates:
    - Report card existence
    - Print permissions
    - School context
    - Report card status

### Usage Notes

1. Authentication middleware should be applied before any protected routes
2. Redis utilities are designed for functional programming with fp-ts
3. Academic guards should be applied to their respective routes for proper access control
