# Auth Service Development Plan

## Service Overview

The Auth Service handles user authentication, authorization, and session management. It implements JWT-based authentication with refresh tokens and OTP functionality.

## Dependencies

### Shared Libraries

```typescript
// From @eduflow/common
import { createLogger, ErrorHandler, SecurityUtils } from '@eduflow/common';

// From @eduflow/types
import { User, OTP, Role, UserStatus } from '@eduflow/types';

// From @eduflow/validators
import { validateEmail, validatePassword } from '@eduflow/validators';

// From @eduflow/middleware
import { rateLimiter, requestValidator } from '@eduflow/middleware';

// From @eduflow/constants
import { ERROR_CODES, USER_STATUSES } from '@eduflow/constants';
```

### External Dependencies

```json
{
  "dependencies": {
    "@fastify/jwt": "^7.0.0",
    "@fastify/redis": "^6.1.1",
    "@fastify/swagger": "^8.8.0",
    "fastify": "^4.21.0",
    "argon2": "^0.31.0",
    "zod": "^3.22.2",
    "ioredis": "^5.3.2",
    "pg": "^8.11.3",
    "@prisma/client": "^5.2.0"
  },
  "devDependencies": {
    "prisma": "^5.2.0",
    "jest": "^29.6.4",
    "typescript": "^5.2.2"
  }
}
```

## Database Schema (Prisma)

```prisma
model User {
  id        String      @id @default(uuid())
  email     String      @unique
  password  String
  role      Role
  status    UserStatus
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  @@map("users")
}

model OTP {
  id        String     @id @default(uuid())
  code      String
  userId    String
  expiresAt DateTime
  status    OTPStatus
  createdAt DateTime   @default(now())

  @@map("otps")
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@map("refresh_tokens")
}

model OwnerOTP {
  id        String   @id @default(uuid())
  code      String
  userId    String
  purpose   String   @default("SCHOOL_LINKING")
  expiresAt DateTime
  status    OTPStatus
  metadata  Json?    // Store school creation context
  createdAt DateTime @default(now())

  @@map("owner_otps")
}

model ParentOTP {
  id        String   @id @default(uuid())
  code      String
  userId    String
  purpose   String   // STUDENT_REGISTRATION or STUDENT_TRANSFER
  schoolId  String   // School requesting access
  expiresAt DateTime
  status    OTPStatus
  metadata  Json?    // Store registration/transfer context
  createdAt DateTime @default(now())

  @@map("parent_otps")
}

model StudentOTP {
  id        String   @id @default(uuid())
  code      String
  userId    String
  purpose   String   // SCHOOL_TRANSFER
  schoolId  String   // New school ID
  expiresAt DateTime
  status    OTPStatus
  metadata  Json?    // Store transfer context
  createdAt DateTime @default(now())

  @@map("student_otps")
}

model TeacherOTP {
  id        String   @id @default(uuid())
  code      String
  userId    String
  purpose   String   // EMPLOYMENT_VERIFICATION
  schoolId  String   // Requesting school
  type      String   // FULL_TIME, PART_TIME
  expiresAt DateTime
  status    OTPStatus
  metadata  Json?    // Store employment context
  createdAt DateTime @default(now())

  @@map("teacher_otps")
}
```

## Event System

### Events Published

```typescript
type AuthEvents = {
  USER_CREATED: {
    userId: string;
    email: string;
    role: Role;
    createdAt: Date;
  };
  USER_UPDATED: {
    userId: string;
    updates: Partial<User>;
  };
  USER_DELETED: {
    userId: string;
  };
  LOGIN_ATTEMPTED: {
    userId: string;
    success: boolean;
    ip: string;
    userAgent: string;
  };
  OTP_GENERATED: {
    userId: string;
    otpId: string;
    expiresAt: Date;
  };
  OWNER_OTP_GENERATED: {
    userId: string;
    otpId: string;
    purpose: string;
    expiresAt: Date;
  };
  OWNER_OTP_VERIFIED: {
    userId: string;
    otpId: string;
    purpose: string;
  };
  PARENT_OTP_GENERATED: {
    userId: string;
    otpId: string;
    purpose: string;
    schoolId: string;
    expiresAt: Date;
  };
  PARENT_OTP_VERIFIED: {
    userId: string;
    otpId: string;
    purpose: string;
    schoolId: string;
  };
  STUDENT_OTP_GENERATED: {
    userId: string;
    otpId: string;
    purpose: string;
    schoolId: string;
    expiresAt: Date;
  };
  STUDENT_OTP_VERIFIED: {
    userId: string;
    otpId: string;
    purpose: string;
    schoolId: string;
  };
  TEACHER_OTP_GENERATED: {
    userId: string;
    otpId: string;
    purpose: string;
    schoolId: string;
    type: string;
    expiresAt: Date;
  };
  TEACHER_OTP_VERIFIED: {
    userId: string;
    otpId: string;
    purpose: string;
    schoolId: string;
    type: string;
  };
};
```

### Events Consumed

```typescript
type ConsumedEvents = {
  KYC_VERIFIED: {
    userId: string;
    documentType: string;
    verificationId: string;
  };
  KYC_REJECTED: {
    userId: string;
    reason: string;
  };
  EMPLOYMENT_ELIGIBILITY_UPDATED: {
    userId: string;
    status: 'ELIGIBLE' | 'INELIGIBLE';
    reason?: string;
  };
};
```

## API Endpoints

### Authentication

```typescript
// POST /auth/register
type RegisterRequest = {
  email: string;
  password: string;
  role: Role;
};

// POST /auth/login
type LoginRequest = {
  email: string;
  password: string;
};

// POST /auth/refresh
type RefreshRequest = {
  refreshToken: string;
};

// POST /auth/logout
type LogoutRequest = {
  refreshToken: string;
};
```

### OTP Management

```typescript
// POST /auth/otp/generate
type GenerateOTPRequest = {
  email: string;
  purpose: OTPPurpose;
};

// POST /auth/otp/verify
type VerifyOTPRequest = {
  email: string;
  code: string;
};
```

### School Owner OTP Management

```typescript
// POST /auth/owner-otp/generate
type GenerateOwnerOTPRequest = {
  email: string;
};

// POST /auth/owner-otp/verify
type VerifyOwnerOTPRequest = {
  code: string;
  email: string;
};
```

### Parent OTP Management

```typescript
// POST /auth/parent-otp/generate
type GenerateParentOTPRequest = {
  email: string;
  purpose: 'STUDENT_REGISTRATION' | 'STUDENT_TRANSFER';
  schoolId: string;
  metadata?: Record<string, unknown>;
};

// POST /auth/parent-otp/verify
type VerifyParentOTPRequest = {
  code: string;
  email: string;
  schoolId: string;
  purpose: string;
};
```

### Student OTP Management

```typescript
// POST /auth/student-otp/generate
type GenerateStudentOTPRequest = {
  email: string;
  purpose: 'SCHOOL_TRANSFER';
  schoolId: string;
  metadata?: Record<string, unknown>;
};

// POST /auth/student-otp/verify
type VerifyStudentOTPRequest = {
  code: string;
  email: string;
  schoolId: string;
};
```

### Teacher OTP Management

```typescript
// POST /auth/teacher-otp/generate
type GenerateTeacherOTPRequest = {
  email: string;
  schoolId: string;
  employmentType: 'FULL_TIME' | 'PART_TIME';
  metadata?: Record<string, unknown>;
};

// POST /auth/teacher-otp/verify
type VerifyTeacherOTPRequest = {
  code: string;
  email: string;
  schoolId: string;
  employmentType: string;
};

// GET /auth/teacher-otp/check-availability
type CheckTeacherAvailabilityRequest = {
  email: string;
  employmentType: 'FULL_TIME' | 'PART_TIME';
};
```

## Implementation Plan

### Phase 1: Core Authentication

1. Basic user registration
2. Login with JWT
3. Refresh token mechanism
4. Password hashing with Argon2

### Phase 2: OTP System

1. OTP generation
2. OTP verification
3. Rate limiting
4. Email integration

### Phase 3: Security Features

1. Role-based access control
2. Session management
3. Brute force protection
4. IP-based blocking

### Phase 4: Integration

1. Event system integration
2. KYC status handling
3. Employment eligibility checks

### Phase 5: School Owner Authentication

1. Owner OTP generation
2. Owner OTP verification
3. School linking validation
4. Owner account security

### Phase 6: Student & Parent Authentication

1. Parent OTP system
2. Student OTP system
3. School access control
4. Transfer authorization

### Phase 7: Teacher Authentication

1. Teacher OTP system
2. Employment verification
3. Availability checking
4. Employment transition handling

## Testing Strategy

### Unit Tests

```typescript
// User service tests
describe('UserService', () => {
  test('should hash password before saving');
  test('should validate email format');
  test('should prevent duplicate emails');
});

// Auth service tests
describe('AuthService', () => {
  test('should generate valid JWT');
  test('should validate refresh tokens');
  test('should handle invalid credentials');
});

// Owner OTP tests
describe('OwnerOTPService', () => {
  test('should generate owner OTP');
  test('should verify owner OTP');
  test('should handle invalid OTP');
  test('should prevent OTP reuse');
});

// Parent OTP tests
describe('ParentOTPService', () => {
  test('should generate parent OTP');
  test('should verify parent OTP');
  test('should validate school access');
  test('should handle registration purpose');
  test('should handle transfer purpose');
});

// Student OTP tests
describe('StudentOTPService', () => {
  test('should generate student OTP');
  test('should verify student OTP');
  test('should validate school transfer');
});

// Teacher OTP tests
describe('TeacherOTPService', () => {
  test('should generate teacher OTP');
  test('should verify employment eligibility');
  test('should validate employment type');
  test('should check availability');
});
```

### Integration Tests

```typescript
describe('Auth API', () => {
  test('should register new user');
  test('should login user');
  test('should refresh token');
  test('should handle rate limiting');
});

describe('Owner OTP API', () => {
  test('should generate OTP for existing user');
  test('should verify OTP for school linking');
  test('should handle rate limiting');
});

describe('Parent OTP API', () => {
  test('should generate OTP for registration');
  test('should generate OTP for transfer');
  test('should verify OTP with purpose');
});

describe('Student OTP API', () => {
  test('should generate OTP for transfer');
  test('should verify transfer OTP');
  test('should handle school access');
});

describe('Teacher OTP API', () => {
  test('should generate employment OTP');
  test('should verify employment status');
  test('should handle employment limits');
});
```

## Monitoring & Logging

### Metrics

- Login attempts
- Failed logins
- OTP generation rate
- Token refresh rate
- Registration success rate

### Logging

```typescript
// Example logging setup
const logger = createLogger({
  service: 'auth-service',
  level: process.env.LOG_LEVEL || 'info',
});
```

## Security Measures

1. Password hashing with Argon2
2. Rate limiting on all endpoints
3. JWT with short expiry
4. Secure refresh token rotation
5. OTP expiry and single-use
6. Purpose-specific OTP validation
7. School-specific access control
8. Transfer authorization checks
9. Employment eligibility validation
10. Part-time limit enforcement
11. Employment transition checks
