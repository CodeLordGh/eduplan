# ABAC Usage Guide for Microservices

## Overview

This guide explains how to effectively use the Attribute-Based Access Control (ABAC) system in microservices under the `apps` folder. The system provides fine-grained access control based on user attributes, environmental conditions, and resource characteristics, following functional programming principles.

## Setup

### 1. Install Dependencies

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

### 2. Initialize ABAC

```typescript
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';
import { AccessPolicy, UserAttributes, ValidationResult } from '@eduflow/types';
import { evaluateAccess } from '@eduflow/types/auth';
import { abacMiddleware } from '@eduflow/middleware';
```

## Usage Patterns

### 1. API Route Protection

```typescript
import { FastifyInstance } from 'fastify';
import { authenticate } from '@eduflow/middleware';

const createDocumentPolicy = (action: ResourceAction): AccessPolicy => ({
  resource: 'document',
  action,
  conditions: {
    roles: ['TEACHER', 'ADMIN'],
    school: {
      mustBeInSchool: true,
      mustBeCurrentSchool: true,
    },
    verification: {
      requireKYC: true,
      kycStatus: ['VERIFIED'],
    },
  },
});

const createGradePolicy = (action: ResourceAction): AccessPolicy => ({
  resource: 'grade',
  action,
  conditions: {
    roles: ['TEACHER'],
    school: {
      mustBeInSchool: true,
      mustBeCurrentSchool: true,
    },
    verification: {
      requireKYC: true,
      employmentStatus: ['VERIFIED'],
    },
    environment: {
      timeRestrictions: {
        allowedDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
        allowedHours: ['09:00-17:00'],
        timezone: 'UTC',
      },
    },
  },
});

export const createRoutes = (app: FastifyInstance) => {
  // Document management routes
  app.get(
    '/documents/:id',
    authenticate,
    abacMiddleware(createDocumentPolicy('READ')),
    async (request, reply) =>
      pipe(
        request.params.id,
        getDocument,
        TE.map((document) => reply.send(document))
      )()
  );

  // Grade management routes
  app.put(
    '/grades/:id',
    authenticate,
    abacMiddleware(createGradePolicy('UPDATE')),
    async (request, reply) =>
      pipe(
        request.params.id,
        (id) => updateGrade(id, request.body),
        TE.map((grade) => reply.send(grade))
      )()
  );
};
```

### 2. Service Layer Access Control

```typescript
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { logger } from './logger';

const createViewDocumentPolicy = (): AccessPolicy => ({
  resource: 'document',
  action: 'READ',
  conditions: {
    roles: ['TEACHER', 'ADMIN'],
    school: { mustBeInSchool: true },
  },
});

const viewDocument = (userId: string, documentId: string): TE.TaskEither<AppError, Document> =>
  pipe(
    TE.tryCatch(
      () => evaluateAccess(userId, createViewDocumentPolicy()),
      (error) => {
        logger.error('Access evaluation failed', { error });
        return createUnauthorizedError('Access check failed');
      }
    ),
    TE.chain((result) =>
      !result.granted ? TE.left(createForbiddenError(result.reason)) : TE.right(undefined)
    ),
    TE.chain(() => findDocumentById(documentId))
  );
```

### 3. Background Job Access Control

```typescript
const createGradeProcessingPolicy = (): AccessPolicy => ({
  resource: 'grade',
  action: 'UPDATE',
  conditions: {
    roles: ['SYSTEM'],
    verification: {
      requireKYC: false,
    },
    environment: {
      timeRestrictions: {
        allowedHours: ['00:00-23:59'],
      },
    },
  },
});

const processGradeJob = (jobData: GradeJobData): TE.TaskEither<Error, void> =>
  pipe(
    TE.tryCatch(
      () => evaluateAccess('SYSTEM', createGradeProcessingPolicy()),
      (error) => new Error(`Access evaluation failed: ${error}`)
    ),
    TE.chain((result) =>
      !result.granted
        ? TE.left(new Error(`Grade processing not allowed: ${result.reason}`))
        : TE.right(undefined)
    ),
    TE.chain(() => processGrades(jobData))
  );
```

### 4. WebSocket Access Control

```typescript
const createWebSocketPolicy = (): AccessPolicy => ({
  resource: 'websocket',
  action: 'CREATE',
  conditions: {
    roles: ['USER', 'TEACHER', 'ADMIN'],
    verification: {
      requireKYC: true,
    },
    environment: {
      deviceRestrictions: {
        requireTrusted: true,
        minTrustScore: 0.7,
      },
    },
  },
});

const handleWebSocketConnection = (
  socket: WebSocket,
  request: Request
): TE.TaskEither<Error, void> =>
  pipe(
    TE.tryCatch(
      () => getUserFromSocket(socket),
      (error) => new Error(`Failed to get user: ${error}`)
    ),
    TE.chain((userId) =>
      TE.tryCatch(
        () => evaluateAccess(userId, createWebSocketPolicy()),
        (error) => new Error(`Access evaluation failed: ${error}`)
      )
    ),
    TE.chain((result) =>
      !result.granted ? TE.left(new Error(result.reason)) : TE.right(undefined)
    ),
    TE.map(() => handleConnection(socket))
  );
```

## Best Practices

### 1. Policy Organization

```typescript
// policies/document.ts
const createDocumentPolicies = () => ({
  view: createPolicy('document', 'READ', {
    roles: ['TEACHER', 'ADMIN'],
  }),

  edit: createPolicy('document', 'UPDATE', {
    roles: ['TEACHER'],
    school: { mustBeCurrentSchool: true },
  }),

  delete: createPolicy('document', 'DELETE', {
    roles: ['ADMIN'],
    verification: { requireKYC: true },
  }),
});

// Usage
app.delete(
  '/documents/:id',
  authenticate,
  abacMiddleware(createDocumentPolicies().delete),
  (request, reply) =>
    pipe(
      request.params.id,
      deleteDocument,
      TE.map(() => reply.status(204).send())
    )()
);
```

### 2. Error Handling

```typescript
const handleAbacError =
  (error: unknown) =>
  (request: FastifyRequest): AppError =>
    pipe(
      error,
      E.fromPredicate(isAbacError, () => error),
      E.map((abacError) => {
        request.log.warn('Access denied', {
          userId: request.user.id,
          path: request.url,
          reason: abacError.message,
        });
        return createForbiddenError(abacError.message);
      }),
      E.getOrElse(() => error as Error)
    );

app.get('/protected', authenticate, abacMiddleware(createPolicy()), async (request, reply) =>
  pipe(
    TE.tryCatch(
      () => processRequest(request),
      (error) => handleAbacError(error)(request)
    ),
    TE.map((data) => reply.send(data))
  )()
);
```

### 3. Logging and Monitoring

```typescript
const createLoggedAbacMiddleware = (policy: AccessPolicy) => {
  const accessLogger = logger.child({ component: 'abac' });

  return async (request: FastifyRequest, reply: FastifyReply) =>
    pipe(
      TE.Do,
      TE.bind('startTime', () => TE.right(Date.now())),
      TE.chain(() =>
        TE.tryCatch(
          () => abacMiddleware(policy)(request, reply),
          (error) => error as Error
        )
      ),
      TE.map((result) => {
        accessLogger.info('Access granted', {
          userId: request.user.id,
          resource: policy.resource,
          action: policy.action,
          duration: Date.now() - result.startTime,
        });
        return result;
      }),
      TE.mapLeft((error) => {
        accessLogger.warn('Access denied', {
          userId: request.user.id,
          resource: policy.resource,
          action: policy.action,
          reason: error.message,
          duration: Date.now() - error.startTime,
        });
        throw error;
      })
    )();
};
```

## Performance Optimization

### 1. Caching Results

```typescript
import * as O from 'fp-ts/Option';
import { flow } from 'fp-ts/function';

const createAccessCache = () => {
  const cache = new Map<string, ValidationResult>();
  const TTL = 5 * 60 * 1000; // 5 minutes

  const getCacheKey = (userId: string, policy: AccessPolicy): string =>
    `${userId}:${policy.resource}:${policy.action}`;

  const get = (userId: string, policy: AccessPolicy): O.Option<ValidationResult> =>
    pipe(getCacheKey(userId, policy), (key) => cache.get(key), O.fromNullable);

  const set = (userId: string, policy: AccessPolicy, result: ValidationResult): void => {
    const key = getCacheKey(userId, policy);
    cache.set(key, result);
    setTimeout(() => cache.delete(key), TTL);
  };

  return { get, set };
};

const accessCache = createAccessCache();

const cachedEvaluateAccess = (
  userId: string,
  policy: AccessPolicy
): TE.TaskEither<AppError, ValidationResult> =>
  pipe(
    accessCache.get(userId, policy),
    O.fold(
      () =>
        pipe(
          evaluateAccess(userId, policy),
          TE.map((result) => {
            accessCache.set(userId, policy, result);
            return result;
          })
        ),
      (result) => TE.right(result)
    )
  );
```

### 2. Batch Evaluation

```typescript
const batchEvaluateAccess = (
  userId: string,
  policies: AccessPolicy[]
): TE.TaskEither<AppError, Map<string, ValidationResult>> =>
  pipe(
    TE.tryCatch(
      () => collectUserAttributes(userId),
      (error) => createUnauthorizedError('Failed to collect attributes', error)
    ),
    TE.chain((attributes) =>
      pipe(
        policies,
        TE.traverseArray((policy) =>
          pipe(
            evaluateAccess(userId, policy),
            TE.map((result) => [`${policy.resource}:${policy.action}`, result] as const)
          )
        ),
        TE.map((results) => new Map(results))
      )
    )
  );
```

## Related Documentation

### Core Implementation

- [ABAC Implementation](../../libs/common/docs/abac.md)
- [Error Handling Implementation](../../libs/common/docs/error-handling.md)
- [Logger Implementation](../../libs/logger/docs/logger-implementation.md)

### Integration Guides

- [ABAC Integration Guide](../../libs/docs/abac-integration.md)
- [Error Handling Integration](../../libs/docs/error-handling-integration.md)
- [Logger Integration](../../libs/docs/logger-integration.md)

### Usage Guides

- [Error Handling Usage](./error-handling-usage.md)
- [Logger Usage](./logger-usage.md)

### Additional Resources

- [System Integration](./system-integration.md)
- [ABAC Flow](../../libs/types/src/auth/ABAC_FLOW.md)
- [ABAC Types](../../libs/types/src/auth/ABAC.md)
