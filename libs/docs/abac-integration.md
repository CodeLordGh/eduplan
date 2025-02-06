# ABAC Integration Guide for Libraries

## Overview
This guide focuses on integrating the Attribute-Based Access Control (ABAC) system into your libraries. For a complete understanding of the ABAC system, please refer to the [ABAC Documentation](../common/docs/abac.md).

## Quick Start

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

// Usage with Fastify
app.get('/documents/:id',
  authenticate,
  async (request, reply) => pipe(
    createAbacMiddleware(createBasicPolicy('document', 'READ', ['TEACHER']))(request, reply),
    TE.chain(() => getDocument(request.params.id)),
    TE.map((document) => reply.send(document))
  )()
);
```

### 3. Error Handling Integration
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

## Testing Integration

### 1. Policy Testing
```typescript
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
```

## Related Documentation

### Core Documentation
- [ABAC Documentation](../common/docs/abac.md) - Complete ABAC system documentation
- [Error Handling](../common/docs/error-handling.md) - Error handling system
- [Logger Integration](../logger/docs/logger.md) - Logging system integration

### Implementation Details
- [ABAC Flow](../types/src/auth/ABAC_FLOW.md) - Implementation flow and architecture
- [Middleware Documentation](../middleware/docs/middleware.md) - ABAC middleware details
