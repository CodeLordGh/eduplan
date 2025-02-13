# School Registration Implementation Plan

## Overview

This document outlines the implementation plan for the school registration system, utilizing the available libraries and following functional programming principles with enhanced ABAC integration.

## File Structure

```typescript
apps / school - service / src / registration / handlers.ts; // Event handlers
validators.ts; // Input validation
events.ts; // Event definitions
errors.ts; // Error definitions
types.ts; // Type definitions
utils.ts; // Utility functions
rate - limit.ts; // Rate limiting logic
notifications.ts; // Notification handling
policies / index.ts; // Policy exports
school.ts; // School policies
verification.ts; // Verification policies
time.ts; // Time-based policies
custom.ts; // Custom evaluators
```

## Implementation Details

### 1. ABAC Policies (policies/school.ts)

```typescript
// School Registration Policies
const createSchoolRegistrationPolicy = (action: ResourceAction): AccessPolicy => ({
  resource: 'school',
  action,
  conditions: {
    anyOf: {
      roles: ['SYSTEM_ADMIN', 'SCHOOL_ADMIN'],
    },
    verification: {
      requireKYC: true,
      kycStatus: ['VERIFIED'],
      employmentStatus: ['ELIGIBLE'],
    },
    environment: {
      timeRestrictions: {
        allowedDays: ['1', '2', '3', '4', '5'], // Mon-Fri
        allowedHours: ['09', '17'], // 9 AM - 5 PM
      },
      ipRestrictions: {
        allowlist: process.env.ALLOWED_IPS?.split(','),
      },
    },
  },
});

// School Owner Policies
const createSchoolOwnerPolicy = (schoolId: string): AccessPolicy => ({
  resource: 'school',
  action: 'MANAGE',
  conditions: {
    school: {
      mustBeOwner: true,
      mustBeCurrentSchool: true,
    },
    verification: {
      requireKYC: true,
      kycStatus: ['VERIFIED'],
    },
    custom: [
      createCustomEvaluator(
        (attributes) => hasValidSubscription(attributes, schoolId),
        'Active subscription required'
      ),
    ],
  },
});
```

### 2. Event Handlers with ABAC and Enhanced Logging (handlers.ts)

```typescript
// Enhanced logger creation for operations
const createOperationLogger = (baseLogger: Logger, context: OperationContext): Logger =>
  baseLogger.child({
    operation: context.operationType,
    requestId: context.requestId,
    userId: context.userId,
    clientInfo: context.clientInfo,
  });

// Registration Event Handler with enhanced logging
const handleRegistrationEvent = (
  event: RegistrationEvent,
  context: EventContext
): TE.TaskEither<AppError, void> =>
  pipe(
    TE.Do,
    // Create operation-specific logger
    TE.bind('logger', () =>
      TE.right(
        createOperationLogger(context.logger, {
          operationType: 'school_registration',
          ...context,
        })
      )
    ),
    // Log operation start
    TE.chain(({ logger }) =>
      TE.right(
        logger.info('Starting school registration', {
          schoolInfo: event.data.schoolInfo,
        })
      )
    ),
    // Validate ABAC policy with logging
    TE.chain(({ logger }) =>
      pipe(
        validateAccessPolicy(createSchoolRegistrationPolicy('CREATE')),
        TE.tap(() => TE.right(logger.info('ABAC policy validated')))
      )
    ),
    // Process with logging
    TE.chain(({ logger }) =>
      pipe(
        processRegistration(event),
        TE.tap((result) => TE.right(logger.info('Registration processed', { result })))
      )
    ),
    // Error handling with logging
    TE.mapLeft((error) => {
      context.logger.error('Registration failed', { error });
      return enhanceError(context)(error);
    })
  );

// Verification Event Handler
const handleVerificationEvent = (
  event: VerificationEvent,
  context: EventContext
): TE.TaskEither<AppError, void> =>
  pipe(
    // Validate verification policy
    validateAccessPolicy(createVerificationPolicy(event.schoolId)),

    // Process verification
    TE.chain(() => processVerification(event)),

    // Update verification status
    TE.chain(updateVerificationStatus),

    // Emit verification events
    TE.chain(emitVerificationEvents)
  );
```

### 3. Event Definitions with ABAC Context (events.ts)

```typescript
// Registration Events
type RegistrationEvent = {
  type: 'REGISTRATION_INITIATED';
  data: {
    schoolInfo: SchoolInfo;
    ownerInfo: OwnerInfo;
    context: {
      requestId: string;
      clientInfo: ClientInfo;
      abacDecision: {
        granted: boolean;
        evaluatedAt: Date;
        policies: string[];
      };
    };
  };
};

// Access Events
type AccessEvent = {
  type: 'ACCESS_DECISION';
  data: {
    userId: string;
    resource: string;
    action: string;
    granted: boolean;
    reason?: string;
    context: {
      requestId: string;
      timestamp: Date;
      clientInfo: ClientInfo;
    };
  };
};

// Verification Events
type VerificationEvent = {
  type: 'VERIFICATION_STATUS_CHANGED';
  data: {
    schoolId: string;
    ownerId: string;
    previousStatus: VerificationStatus;
    newStatus: VerificationStatus;
    verifiedBy: string;
    context: {
      requestId: string;
      abacContext: AbacContext;
    };
  };
};
```

### 4. Event-Driven Flow with ABAC

```typescript
// Registration Flow
const registerNewSchoolOwner = (
  data: NewSchoolRegistrationData,
  context: OperationContext
): TE.TaskEither<AppError, SchoolRegistrationResult> =>
  pipe(
    // Initial ABAC check
    validateInitialAccess(data, context),

    // Emit registration initiated event
    TE.chain(emitRegistrationInitiated),

    // Process registration steps
    TE.chain(processRegistrationSteps),

    // Verify and setup school
    TE.chain(verifyAndSetupSchool),

    // Setup owner access
    TE.chain(setupOwnerAccess),

    // Emit completion events
    TE.chain(emitCompletionEvents)
  );

// Registration Steps Processing
const processRegistrationSteps = (
  data: ValidatedRegistrationData
): TE.TaskEither<AppError, ProcessingResult> =>
  pipe(
    // Create user with ABAC context
    createUserWithAbac(data.ownerInfo),

    // Create school with ABAC context
    TE.chain(createSchoolWithAbac),

    // Setup verification with ABAC context
    TE.chain(setupVerificationWithAbac),

    // Setup notifications with ABAC context
    TE.chain(setupNotificationsWithAbac)
  );
```

### 5. Error Handling with ABAC Context

```typescript
// ABAC-aware error handling
const enhanceErrorWithAbac = (error: AppError, context: AbacContext): AppError => ({
  ...error,
  metadata: {
    ...error.metadata,
    abacContext: {
      policies: context.evaluatedPolicies,
      decision: context.accessDecision,
      timestamp: context.evaluatedAt,
    },
  },
});

// Error event emission
const emitErrorEvent = (error: AppError, context: EventContext): TE.TaskEither<AppError, void> =>
  pipe(
    createErrorEvent(error, context),
    publishEvent,
    TE.mapLeft(enhanceErrorWithAbac(context.abac))
  );
```

### 6. Integration Setup with ABAC

```typescript
// Service setup with ABAC integration
const setupSchoolService = (config: ServiceConfig): TE.TaskEither<Error, Service> =>
  pipe(
    TE.Do,
    // Create logger with ABAC context
    TE.bind('logger', () => createAbacAwareLogger()),

    // Create event bus with ABAC middleware
    TE.bind('eventBus', ({ logger }) => createAbacAwareEventBus(logger)),

    // Setup ABAC policies
    TE.bind('policies', () => setupAbacPolicies()),

    // Create service instance
    TE.map(({ logger, eventBus, policies }) => ({
      logger,
      eventBus,
      policies,
      handlers: {
        registerNewSchool: registerNewSchoolOwner,
        registerExistingSchool: registerExistingSchoolOwner,
      },
    }))
  );
```

### 7. Enhanced Error Handling Integration (errors.ts)

```typescript
import { ERROR_CODES, HTTP_STATUS } from '@eduflow/constants';

// Enhanced error creators with constants integration
const createRegistrationError = (
  code: ErrorCode,
  message: string,
  metadata?: Record<string, unknown>
): AppError =>
  createAppError({
    code,
    message,
    metadata: {
      ...metadata,
      errorCategory: 'REGISTRATION',
    },
  });

// Specialized error creators
const createValidationError = (field: string, value: unknown, constraint: string): AppError =>
  createRegistrationError(ERROR_CODES.VALIDATION_ERROR, `Invalid ${field}: ${constraint}`, {
    field,
    value,
    constraint,
  });

const createVerificationError = (reason: string, metadata: Record<string, unknown>): AppError =>
  createRegistrationError(
    ERROR_CODES.VERIFICATION_ERROR,
    `Verification failed: ${reason}`,
    metadata
  );

// ... existing error handling code remains unchanged ...
```

### 8. Rate Limiting Implementation with Redis (rate-limit.ts)

```typescript
// Enhanced rate limiting with Redis integration
const checkRateLimit = (context: OperationContext, logger: Logger): TE.TaskEither<AppError, void> =>
  pipe(
    getRateLimitConfig(context),
    TE.chain((config) =>
      pipe(
        validateRateLimit(config),
        TE.tap(() =>
          TE.right(
            logger.debug('Rate limit checked', {
              userId: context.userId,
              ip: context.clientInfo.ip,
            })
          )
        )
      )
    ),
    TE.mapLeft((error) =>
      createRegistrationError(ERROR_CODES.RATE_LIMIT_EXCEEDED, 'Rate limit exceeded', {
        limit: error.limit,
        remaining: error.remaining,
        resetAt: error.resetAt,
      })
    )
  );

// ... existing rate limiting code remains unchanged ...
```

### 9. Enhanced Notification System (notifications.ts)

```typescript
// Enhanced notification handling with logging and error handling
const queueWelcomeNotification = (
  result: SchoolRegistrationResult,
  logger: Logger
): TE.TaskEither<AppError, void> =>
  pipe(
    createWelcomeEmailPayload(result),
    TE.chain((payload) =>
      pipe(
        queueNotification(payload),
        TE.tap(() =>
          TE.right(
            logger.info('Welcome notification queued', {
              schoolId: result.schoolId,
            })
          )
        ),
        TE.mapLeft((error) =>
          createRegistrationError(
            ERROR_CODES.NOTIFICATION_ERROR,
            'Failed to queue welcome notification',
            { cause: error }
          )
        )
      )
    )
  );

// ... existing notification code remains unchanged ...
```

### 10. Constants Integration (constants.ts)

```typescript
import {
  ERROR_CODES,
  HTTP_STATUS,
  ROLES,
  KYC_STATUS,
  EMPLOYMENT_STATUS,
  TIME_RESTRICTIONS,
} from '@eduflow/constants';

// Verification deadlines using constants
export const VERIFICATION_DEADLINES = {
  SCHOOL: TIME_RESTRICTIONS.SCHOOL_VERIFICATION_PERIOD,
  KYC: TIME_RESTRICTIONS.KYC_VERIFICATION_PERIOD,
};

// Enhanced policy with constants
const createEnhancedSchoolRegistrationPolicy = (action: ResourceAction): AccessPolicy => ({
  resource: 'school',
  action,
  conditions: {
    anyOf: {
      roles: [ROLES.SYSTEM_ADMIN, ROLES.SCHOOL_ADMIN],
    },
    verification: {
      requireKYC: true,
      kycStatus: [KYC_STATUS.VERIFIED],
      employmentStatus: [EMPLOYMENT_STATUS.ELIGIBLE],
    },
    environment: {
      timeRestrictions: TIME_RESTRICTIONS.BUSINESS_HOURS,
      ipRestrictions: {
        allowlist: process.env.ALLOWED_IPS?.split(','),
      },
    },
  },
});

// ... existing constants usage remains unchanged ...
```

## Implementation Constraints

### 1. Functional Programming

- NO classes or `this` keyword
- All functions must be pure
- Use fp-ts for all operations
- Use pipe for function composition

### 2. Error Handling

- Use TaskEither for all async operations
- Use Either for sync operations
- Use Option for nullable values
- All errors must use error creators

### 3. Logging

- Use child loggers for context
- Log all operations with proper levels
- Redact sensitive information
- Include correlation IDs

### 4. Events

- Use event bus for all async communication
- Validate all events
- Include proper metadata
- Handle failed events

### 5. Validation

- Validate all inputs
- Use zod schemas
- Include detailed error messages
- Validate at boundaries

### 6. Security

- Only system admin can create schools
- Validate OTP for existing users
- Set proper ABAC policies
- Handle sensitive data properly

### 7. Rate Limiting Constraints

- Implement per-IP and per-user rate limiting
- Configure different limits for authenticated/anonymous users
- Handle rate limit headers in responses
- Implement graceful degradation

### 8. Notification Constraints

- Use templated notifications
- Handle notification failures
- Implement retry mechanisms
- Track notification status

### 9. ABAC Integration Constraints

- Implement full ABAC policy lifecycle
- Use event-driven policy evaluation
- Maintain policy audit trail
- Handle policy versioning

### 10. Event-Driven ABAC Constraints

- Emit access decision events
- Track policy evaluation metrics
- Handle policy updates via events
- Maintain ABAC state consistency

## Development Limits

### 1. Code Organization

- Stick to the defined file structure
- No additional directories
- No circular dependencies
- Maximum file size: 200 lines

### 2. Function Constraints

- Maximum function length: 20 lines
- Maximum parameters: 3
- Must use type annotations
- Must include JSDoc

### 3. Error Handling

- Must use predefined error types
- No throwing raw errors
- Must log all errors
- Must preserve error context

### 4. Testing Requirements

- Unit tests for all functions
- Integration tests for flows
- Mock external services
- Test error cases

## Integration with Existing Libraries

### 1. Logger Integration

- Use the logger library for all logging operations
- Create child loggers for each operation
- Follow the logging patterns from `@eduflow/logger`
- Implement proper error logging

### 2. Event System Integration

- Use the event system for all async operations
- Follow the event patterns from `@eduflow/events`
- Implement proper event validation
- Handle event failures gracefully

### 3. Error Handling Integration

- Use the error handling system from `@eduflow/common`
- Follow the error patterns for all error cases
- Implement proper error context
- Use the error types from `@eduflow/types`

### 4. ABAC Integration

- Implement proper access control using ABAC
- Follow the ABAC patterns from `@eduflow/common`
- Implement role-based access control
- Handle permission checks properly

## Verification Process

### 1. School Verification

- Set 1-year deadline for school verification
- Implement document upload functionality
- Handle verification status updates
- Implement restriction handling

### 2. KYC Verification

- Set 3-month deadline for KYC verification
- Implement document validation
- Handle KYC status updates
- Implement access restrictions

## Testing Strategy

### 1. Unit Tests

- Test all pure functions
- Test validation logic
- Test error handling
- Test event handling

### 2. Integration Tests

- Test complete registration flows
- Test verification processes
- Test error scenarios
- Test event handling

### 3. E2E Tests

- Test complete user journeys
- Test system integration
- Test error recovery
- Test performance

## Documentation Requirements

### 1. Code Documentation

- JSDoc for all functions
- Type documentation
- Error documentation
- Event documentation

### 2. API Documentation

- OpenAPI specification
- Request/response examples
- Error responses
- Authentication requirements

### 3. Integration Documentation

- Setup instructions
- Configuration options
- Example usage
- Troubleshooting guide

## Development Guidelines

### Function Implementation Rules

1. Only implement functions explicitly defined in this document
2. Do not add extra functionality beyond what's specified
3. Follow the exact type signatures provided
4. Use only the listed dependencies

### Scope Limitations

1. No additional validation beyond specified
2. No extra error types
3. No custom logging patterns
4. No alternative implementations
