# ABAC Integration Guide for Libraries

## Overview
This guide explains how to integrate the Attribute-Based Access Control (ABAC) system into libraries. The system provides fine-grained access control based on user attributes, environmental conditions, and resource characteristics, following functional programming principles with fp-ts.

## Integration Steps

### 1. Add Dependencies
```json
{
  "dependencies": {
    "@eduflow/common": "workspace:*",
    "@eduflow/types": "workspace:*",
    "@eduflow/middleware": "workspace:*",
    "fp-ts": "^2.16.0"
  }
}
```

### 2. Import Required Modules
```typescript
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import { 
  AccessPolicy,
  PolicyConditions,
  UserAttributes,
  ValidationResult 
} from '@eduflow/types';
import { evaluateAccess } from '@eduflow/types/auth';
import { 
  createUnauthorizedError,
  createForbiddenError 
} from '@eduflow/common';
```

## Policy Definition

### 1. Basic Policy
```typescript
const createBasicPolicy = (
  resource: string,
  action: ResourceAction,
  roles: Role[]
): AccessPolicy => ({
  resource,
  action,
  conditions: {
    roles,
    verification: {
      requireKYC: true
    }
  }
});
```

### 2. School-Specific Policy
```typescript
const createSchoolPolicy = (
  resource: string,
  action: ResourceAction,
  schoolId: string,
  roles: Role[]
): AccessPolicy => ({
  resource,
  action,
  conditions: {
    roles,
    school: {
      mustBeInSchool: true,
      mustBeCurrentSchool: true,
      allowedRoles: roles
    },
    verification: {
      requireKYC: true,
      employmentStatus: ['VERIFIED']
    }
  }
});
```

### 3. Time-Restricted Policy
```typescript
const createTimeRestrictedPolicy = (
  resource: string,
  action: ResourceAction,
  timeRestrictions: TimeRestrictions
): AccessPolicy => ({
  resource,
  action,
  conditions: {
    environment: {
      timeRestrictions
    }
  }
});
```

## Integration Patterns

### 1. Service Layer Integration
```typescript
const processDocument = (
  userId: string,
  documentId: string
): TE.TaskEither<AppError, Document> =>
  pipe(
    TE.tryCatch(
      () => evaluateAccess(userId, createBasicPolicy('document', 'READ', ['TEACHER'])),
      (error) => createUnauthorizedError('Access denied', error)
    ),
    TE.chain((result) =>
      !result.granted
        ? TE.left(createForbiddenError(result.reason))
        : TE.right(undefined)
    ),
    TE.chain(() => getDocument(documentId))
  );
```

### 2. Middleware Integration
```typescript
import { FastifyRequest, FastifyReply } from 'fastify';

const createAbacMiddleware = (policy: AccessPolicy) => 
  (request: FastifyRequest, reply: FastifyReply): TE.TaskEither<AppError, void> =>
    pipe(
      TE.tryCatch(
        () => evaluateAccess(request.user.id, policy),
        (error) => createUnauthorizedError('Access check failed', error)
      ),
      TE.chain((result) =>
        !result.granted
          ? TE.left(createForbiddenError(result.reason))
          : TE.right(undefined)
      )
    );

// Usage
app.get('/documents/:id',
  authenticate,
  async (request, reply) => pipe(
    createAbacMiddleware(createBasicPolicy('document', 'READ', ['TEACHER']))(request, reply),
    TE.chain(() => getDocument(request.params.id)),
    TE.map((document) => reply.send(document))
  )()
);
```

### 3. Custom Evaluator Integration
```typescript
const createCustomEvaluator = (
  evaluator: (attributes: UserAttributes) => boolean,
  errorMessage: string
) => ({
  evaluator,
  errorMessage
});

const createGradePolicy = (classId: string): AccessPolicy => ({
  resource: 'grade',
  action: 'UPDATE',
  conditions: {
    custom: [
      createCustomEvaluator(
        (attributes) => pipe(
          attributes.classes,
          O.fromNullable,
          O.map((classes) => classes.includes(classId)),
          O.getOrElse(() => false)
        ),
        'Teacher must be assigned to the class'
      )
    ]
  }
});
```

## Testing Integration

### 1. Policy Testing
```typescript
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';

describe('Document Policy', () => {
  const policy = createBasicPolicy('document', 'READ', ['TEACHER']);

  it('should grant access to teachers', async () => {
    const result = await pipe(
      createMockAttributes({
        roles: ['TEACHER'],
        kyc: { status: 'VERIFIED' }
      }),
      (attributes) => evaluateAccess(attributes.id, policy),
      TE.map((result) => expect(result.granted).toBe(true))
    )();
  });
});
```

### 2. Middleware Testing
```typescript
describe('ABAC Middleware', () => {
  it('should enforce policy', async () => {
    const policy = createSchoolPolicy(
      'document',
      'READ',
      'school-1',
      ['TEACHER']
    );

    const middleware = createAbacMiddleware(policy);
    const request = createMockRequest({
      user: {
        id: 'user-1',
        schoolId: 'school-1',
        role: 'TEACHER'
      }
    });

    await pipe(
      middleware(request, reply),
      TE.fold(
        (error) => {
          fail(`Should not fail: ${error.message}`);
          return TE.right(undefined);
        },
        () => TE.right(undefined)
      )
    )();
  });
});

## Best Practices

### 1. Policy Management
```typescript
// Create reusable policy factories
const createResourcePolicy = (
  resource: string,
  action: ResourceAction
) => (
  roles: Role[],
  options: PolicyOptions
): AccessPolicy => ({
  resource,
  action,
  conditions: {
    roles,
    ...options
  }
});

// Compose policies
const createTeacherPolicy = createResourcePolicy('document', 'READ');
const policy = createTeacherPolicy(['TEACHER'], {
  school: { mustBeCurrentSchool: true }
});
```

### 2. Error Handling
```typescript
const handleAbacError = (error: unknown): TE.TaskEither<AppError, never> =>
  pipe(
    E.fromPredicate(isAbacError, () => error),
    E.fold(
      () => TE.left(createUnauthorizedError('Unknown error', error)),
      (abacError) => TE.left(createForbiddenError(abacError.message))
    )
  );

const processWithAccess = <T>(
  userId: string,
  policy: AccessPolicy,
  operation: () => Promise<T>
): TE.TaskEither<AppError, T> =>
  pipe(
    TE.tryCatch(
      () => evaluateAccess(userId, policy),
      (error) => createUnauthorizedError('Access check failed', error)
    ),
    TE.chain((result) =>
      !result.granted
        ? TE.left(createForbiddenError(result.reason))
        : TE.right(undefined)
    ),
    TE.chain(() => TE.tryCatch(
      operation,
      (error) => handleAbacError(error)
    ))
  );
```

## Available Types

### Core Types
```typescript
type ResourceAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';

interface AccessPolicy {
  resource: string;
  action: ResourceAction;
  conditions: PolicyConditions;
}

interface ValidationResult {
  granted: boolean;
  reason?: string;
}
```

For a complete list of types and utilities, refer to the [ABAC Documentation](../common/docs/abac.md).

## Related Documentation

### Core Implementation
- [ABAC Implementation](../common/docs/abac.md)
- [Error Handling Implementation](../common/docs/error-handling.md)
- [Logger Implementation](../logger/docs/logger-implementation.md)

### Integration Guides
- [Error Handling Integration](./error-handling-integration.md)
- [Logger Integration](./logger-integration.md)

### Usage Guides
- [ABAC Usage Guide](../../apps/docs/abac-usage.md)
- [Error Handling Usage](../../apps/docs/error-handling-usage.md)
- [Logger Usage](../../apps/docs/logger-usage.md)

### Additional Resources
- [System Integration](../../apps/docs/system-integration.md)
- [ABAC Flow](../types/src/auth/ABAC_FLOW.md)
- [ABAC Types](../types/src/auth/ABAC.md)
