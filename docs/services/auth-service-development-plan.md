# Auth Service Development Plan

## Development Rules and Guidelines

### Code Style and Structure
1. **Functional Programming Only**
   - No classes or `this` keyword
   - Pure functions preferred
   - Immutable data structures
   - Use pipe/flow for function composition
   - Use Option/Either for error handling

2. **Code Size Limits**
   - Maximum 200 lines per file
   - Maximum 20 lines per function
   - Maximum 3 parameters per function

3. **File Organization**
   ```
   auth-service/
   ├── src/
   │   ├── domain/        # Pure domain types and validation
   │   ├── routes/        # Route handlers
   │   ├── services/      # Business logic
   │   ├── repository/    # Data access
   │   ├── middleware/    # Request processing
   │   └── utils/         # Shared utilities
   ```

## Implementation Plan

### 1. Core Authentication Enhancement

#### Domain Types (`src/domain/types.ts`)
```typescript
import { Option } from 'fp-ts/Option'
import { Either } from 'fp-ts/Either'

export type MFAType = 'OTP' | 'EMAIL' | 'SMS'

export type MFAConfig = Readonly<{
  type: MFAType
  isEnabled: boolean
  verifiedAt: Option<Date>
}>

export type SessionData = Readonly<{
  id: string
  userId: string
  deviceInfo: string
  ipAddress: string
  lastActive: Date
  mfaVerified: boolean
}>

export type AuthError = 
  | { _tag: 'InvalidCredentials' }
  | { _tag: 'MFARequired' }
  | { _tag: 'SessionExpired' }
```

#### Authentication Service (`src/services/auth.service.ts`)
```typescript
import { pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { TaskEither } from 'fp-ts/TaskEither'
import { User, Credentials } from '../domain/types'

export const authenticate = (
  credentials: Credentials
): TaskEither<AuthError, SessionData> =>
  pipe(
    validateCredentials(credentials),
    TaskEither.chain(verifyMFAIfEnabled),
    TaskEither.chain(createSession)
  )

export const refreshSession = (
  sessionId: string
): TaskEither<AuthError, SessionData> =>
  pipe(
    findSession(sessionId),
    TaskEither.chain(validateSession),
    TaskEither.chain(updateSessionActivity)
  )
```

### 2. OTP System Implementation

#### OTP Domain (`src/domain/otp.ts`)
```typescript
export type OTPPurpose =
  | 'REGISTRATION'
  | 'PASSWORD_RESET'
  | 'MFA'
  | 'ACCOUNT_LINKING'
  | 'ROLE_DELEGATION'

export type OTPData = Readonly<{
  code: string
  purpose: OTPPurpose
  expiresAt: Date
  metadata: Record<string, unknown>
}>
```

#### OTP Service (`src/services/otp.service.ts`)
```typescript
import { pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { OTPData, OTPPurpose } from '../domain/otp'

export const generateOTP = (
  purpose: OTPPurpose,
  metadata: Record<string, unknown>
): TaskEither<Error, OTPData> =>
  pipe(
    createOTPCode(),
    TaskEither.chain(storeOTP(purpose, metadata))
  )

export const validateOTP = (
  code: string,
  purpose: OTPPurpose
): TaskEither<Error, boolean> =>
  pipe(
    findOTP(code),
    TaskEither.chain(verifyOTPPurpose(purpose)),
    TaskEither.chain(verifyOTPExpiration)
  )
```

### 3. Role-Based Access Control

#### Authorization Types (`src/domain/authorization.ts`)
```typescript
export type AuthContext = Readonly<{
  schoolId?: string
  departmentId?: string
  programId?: string
  resourceOwnerId?: string
}>

export type AccessRequest = Readonly<{
  userId: string
  permission: Permission
  context: AuthContext
}>
```

#### Authorization Service (`src/services/authorization.service.ts`)
```typescript
import { pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { AccessRequest } from '../domain/authorization'

export const validateAccess = (
  request: AccessRequest
): TaskEither<Error, boolean> =>
  pipe(
    getUserRoles(request.userId),
    TaskEither.chain(validatePermission(request.permission)),
    TaskEither.chain(validateContext(request.context))
  )

export const delegateRole = (
  fromUserId: string,
  toUserId: string,
  role: Role
): TaskEither<Error, void> =>
  pipe(
    validateDelegationPermission(fromUserId, role),
    TaskEither.chain(assignRole(toUserId, role))
  )
```

### 4. Audit System

#### Audit Types (`src/domain/audit.ts`)
```typescript
export type AuthEventType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'MFA_SETUP'
  | 'MFA_VERIFICATION'
  | 'TOKEN_REFRESH'
  | 'ROLE_CHANGE'

export type AuditEvent = Readonly<{
  eventType: AuthEventType
  userId: string
  metadata: Record<string, unknown>
  timestamp: Date
  status: 'SUCCESS' | 'FAILURE'
  ipAddress: string
  userAgent: string
}>
```

#### Audit Service (`src/services/audit.service.ts`)
```typescript
import { pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { AuditEvent } from '../domain/audit'

export const logAuthEvent = (
  event: AuditEvent
): TaskEither<Error, void> =>
  pipe(
    validateEvent(event),
    TaskEither.chain(enrichEventMetadata),
    TaskEither.chain(persistEvent)
  )

export const queryAuditEvents = (
  filters: AuditEventFilters
): TaskEither<Error, ReadonlyArray<AuditEvent>> =>
  pipe(
    validateFilters(filters),
    TaskEither.chain(fetchEvents)
  )
```

## Implementation Phases

### Phase 1: Core Authentication (Week 1-2)
1. Set up project structure
2. Implement basic authentication
3. Add MFA support
4. Implement session management

### Phase 2: OTP System (Week 2-3)
1. Implement OTP generation
2. Add OTP validation
3. Create OTP storage system
4. Add OTP routes

### Phase 3: RBAC Enhancement (Week 3-4)
1. Implement context-aware authorization
2. Add role delegation
3. Create permission validation
4. Update JWT handling

### Phase 4: Audit System (Week 4-5)
1. Set up audit logging
2. Implement event publishing
3. Create audit queries
4. Add monitoring endpoints

## Testing Strategy

### Unit Tests
- Pure function testing
- No mocking where possible
- Property-based testing for critical functions

### Integration Tests
- API endpoint testing
- Authentication flow testing
- Authorization scenarios
- Audit trail verification

## Monitoring and Observability

### Metrics to Track
1. Authentication success/failure rates
2. MFA usage statistics
3. OTP validation rates
4. Role delegation patterns
5. Authorization decision timings

### Logging Guidelines
1. Use structured logging
2. Include correlation IDs
3. Avoid sensitive data in logs
4. Use appropriate log levels

## Security Considerations

1. **Token Security**
   - Short-lived access tokens
   - Secure token storage
   - Regular token rotation

2. **OTP Security**
   - Rate limiting
   - Expiration policies
   - Anti-brute force measures

3. **Audit Trail**
   - Immutable audit logs
   - Secure storage
   - Retention policies

## Dependencies

```typescript
// package.json additions
{
  "dependencies": {
    "fp-ts": "^2.16.1",
    "io-ts": "^2.2.20",
    "argon2": "^0.31.2",
    "jose": "^5.1.3",
    "redis": "^4.6.11"
  }
}
``` 