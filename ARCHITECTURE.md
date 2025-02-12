# Architecture Enforcement Guide

This document explains the architectural rules and constraints that are automatically enforced in this codebase through ESLint configuration.

## Core Principles

1. **Pure Functional Programming**
   - No classes or object-oriented patterns
   - No use of `this` keyword
   - Immutable data structures only
   - Pure functions with no side effects
   - Point-free style where possible
   - Functional error handling (Either/Result types) instead of exceptions

2. **Package Responsibility Isolation**
   - Each package has a single, well-defined responsibility
   - No implementation logic in type definitions
   - Clear boundaries between packages
   - Explicit and controlled dependencies

## Directory Structure

The codebase follows a strict directory structure that is automatically enforced:

```
libss/
├── types/                    # ONLY type definitions, interfaces, and type aliases
├── common/                   # Pure functions and shared utilities
├── middleware/               # Pure HTTP middleware functions
├── events/                   # Event handling pure functions
├── prisma/                   # Database queries as pure functions
├── logger/                   # Pure logging functions
└── constants/               # Immutable constant values
```

Each package is published under the `@eduflow` namespace and has strict content rules:

1. `@eduflow/types`:
   - ✅ Type definitions, interfaces, type aliases
   - ✅ Type guards (pure functions)
   - ❌ NO classes
   - ❌ NO implementation logic
   - ❌ NO side effects
   - Can only import from: `@eduflow/constants`

2. `@eduflow/common`:
   - ✅ Pure utility functions
   - ✅ Business logic as pure functions
   - ✅ Functional transformations
   - ❌ NO classes or OOP patterns
   - ❌ NO side effects
   - Can import from: `@eduflow/types`, `@eduflow/constants`, `@eduflow/prisma`, `@eduflow/logger`

3. `@eduflow/middleware`:
   - ✅ Pure middleware functions
   - ✅ Request/Response transformations
   - ❌ NO stateful middleware
   - ❌ NO classes
   - Can import from: `@eduflow/types`, `@eduflow/common`, `@eduflow/constants`, `@eduflow/logger`

4. `@eduflow/events`:
   - ✅ Pure event handler functions
   - ✅ Event transformations
   - ❌ NO direct database access
   - ❌ NO side effects outside event system
   - Can import from: `@eduflow/types`, `@eduflow/common`, `@eduflow/constants`, `@eduflow/logger`

5. `@eduflow/prisma`:
   - ✅ Pure database query functions
   - ✅ Data transformations
   - ❌ NO business logic
   - ❌ NO direct model mutations
   - Can only import from: `@eduflow/types`

6. `@eduflow/logger`:
   - ✅ Pure logging functions
   - ✅ Log transformations
   - ❌ NO side effects outside logging
   - Can import from: `@eduflow/types`, `@eduflow/constants`

7. `@eduflow/constants`:
   - ✅ Readonly constant values
   - ✅ Enum definitions
   - ❌ NO functions
   - ❌ NO mutable values

## Code Organization Rules

### 1. Function Rules
- Maximum 20 lines per function
- Pure functions only
- No side effects
- Explicit return types
- Input parameters must be readonly

### 2. Data Rules
- All data structures must be immutable
- Use readonly arrays and readonly objects
- No let declarations, only const
- No loops, use functional alternatives (map, filter, reduce)

### 3. Error Handling
- Use functional error handling (Either/Result types)
- No throw statements
- Error must be part of function return types
- Use union types for error cases

### 4. Naming Conventions
```typescript
// Types and Interfaces
type UserData = Readonly<{
  id: string;
  email: string;
}>;

interface IUserRepository {
  readonly findById: (id: string) => Promise<Either<Error, UserData>>;
}

// Pure Functions
const findUserById = (id: string): Promise<Either<Error, UserData>> => {
  // Implementation
};

// Point-free Style
const getEmailFromUser = pipe(
  getUserData,
  map(user => user.email)
);
```

### 5. Common Patterns

#### Pure Function Pattern
```typescript
// In @eduflow/common/src/user/operations.ts
import { Either, right, left } from '@eduflow/types/either';
import { IUser } from '@eduflow/types/user';
import { UserError } from '@eduflow/types/errors';

export const validateUser = (
  userData: Readonly<{email: string; name: string}>
): Either<UserError, IUser> => {
  const isValidEmail = /^[^@]+@[^@]+$/.test(userData.email);
  
  return isValidEmail
    ? right({ ...userData })
    : left({ type: 'INVALID_EMAIL' });
};
```

#### Event Handler Pattern
```typescript
// In @eduflow/events/src/handlers/user.ts
import { IUserEvent } from '@eduflow/types/events';
import { EventResult } from '@eduflow/types/results';

export const handleUserCreated = (
  event: Readonly<IUserEvent>
): Promise<EventResult> => pipe(
  validateEvent(event),
  chain(notifySubscribers),
  chain(updateReadModel)
);
```

## Best Practices

1. **Function Composition**
   - Use pipe and flow for function composition
   - Break complex operations into small, pure functions
   - Compose functions to build complex behavior

2. **Type Safety**
   - Use strict types everywhere
   - No any type
   - Use union types for variants
   - Make all types readonly

3. **Testing**
   - Pure functions are easily testable
   - No need to mock side effects
   - Test input/output pairs
   - Property-based testing encouraged

4. **Error Handling**
   - Use Either or Result types
   - Handle all error cases explicitly
   - No exceptions for control flow
   - Compose error handlers

## Common Issues and Solutions

#### Issue: Side Effects
```typescript
// ❌ Wrong - Side effect
let globalCounter = 0;
const incrementCounter = (): number => ++globalCounter;

// ✅ Correct - Pure function
const incrementCounter = (counter: number): number => counter + 1;
```

#### Issue: Mutation
```typescript
// ❌ Wrong - Mutation
const addUser = (users: User[], user: User): void => {
  users.push(user);
};

// ✅ Correct - Immutable
const addUser = (users: readonly User[], user: User): readonly User[] => [
  ...users,
  user
];
```

#### Issue: Error Handling
```typescript
// ❌ Wrong - Using throw
const divide = (a: number, b: number): number => {
  if (b === 0) throw new Error('Division by zero');
  return a / b;
};

// ✅ Correct - Using Either
const divide = (a: number, b: number): Either<Error, number> =>
  b === 0
    ? left(new Error('Division by zero'))
    : right(a / b);
```

## Troubleshooting

Common ESLint errors and how to fix them:
1. "Mutation of variable not allowed" - Use immutable operations
2. "Function has side effect" - Extract side effect into separate function
3. "Class not allowed" - Convert to pure functions
4. "This expression not allowed" - Remove this keyword, use pure functions
5. "Let declaration not allowed" - Use const and immutable data

## Contributing

When contributing new code:
1. Ensure all functions are pure
2. Use immutable data structures
3. Follow functional programming patterns
4. Put code in the correct package
5. Run linting before submitting PR 