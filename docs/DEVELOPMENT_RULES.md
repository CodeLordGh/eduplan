# Development Rules & Guidelines

## Core Principles

1. **Functional Programming Only**

   - No classes
   - Functional programming only
   - Immutable data structures
   - Function composition over inheritance
   - No side effects (except in designated areas like repositories)
   - Use pipe/flow for function composition
   - Avoid this/new keywords

   ### 2. Function Rules

- Maximum 20 lines per function
- Clear input and output types
- Pure functions whenever possible
- Meaningful function names describing the operation

### 3. File Size Limits

- Maximum 200 lines per file
- If approaching limit, split into focused modules
- Include comments and types in line count
- Exclude import statements from count

2. **Code Organization**

   - Maximum 200 lines per file
   - Single responsibility principle
   - Clear function naming (verb + noun)
   - Explicit return types
   - No implicit any
   - No unused variables/imports

3. **Architecture**
   - CQRS pattern
   - Event-driven architecture
   - Clean Architecture principles
   - Dependency injection through function parameters
   - Clear separation of concerns

## Pre-Implementation Checklist

1. **Read and Understand**

   - Review all related documentation
   - Check existing implementations
   - Understand service dependencies
   - Review event flows
   - Check shared library usage

2. **Ask Questions**

   - Clarify business requirements
   - Verify technical constraints
   - Confirm integration points
   - Validate event flows
   - Check security requirements

3. **Dependencies Check**
   - Review required shared libraries
   - Check for existing implementations
   - Verify version compatibility
   - Confirm event schemas
   - Validate type definitions

## Implementation Guidelines

### Function Structure

```typescript
// Good
const handleUserRegistration = (
  userData: RegisterUserInput,
  hashPassword: (pwd: string) => Promise<string>,
  saveUser: (user: User) => Promise<User>,
  publishEvent: (event: UserCreatedEvent) => Promise<void>
): Promise<User> => {
  // Implementation
};

// Bad - Using class
class UserService {
  constructor(private readonly userRepo: UserRepository) {}
  async registerUser(userData: RegisterUserInput): Promise<User> {
    // Implementation
  }
}
```

### Error Handling

```typescript
// Good
const result = pipe(validateInput, hashPassword, saveUser, publishEvent)(userData);

// Bad
try {
  const user = await userService.register(userData);
} catch (error) {
  handleError(error);
}
```

### State Management

```typescript
// Good
const updateUserState = (currentState: UserState, update: Partial<UserState>): UserState => ({
  ...currentState,
  ...update,
});

// Bad
let userState = {};
userState.status = 'active';
```

## Testing Requirements

- Unit tests for all pure functions
- Integration tests for API endpoints
- E2E tests for critical flows
- Property-based testing for complex logic
- Minimum 80% coverage

## Documentation Requirements

- TSDoc for all functions
- Event documentation
- API documentation (OpenAPI)
- README for each module
- Architecture decision records

## Technology Choices Justification

When selecting technologies, document the reasoning:

Example - Fastify over Express:

1. **Performance**: Fastify is significantly faster due to its schema-based approach
2. **TypeScript Support**: Better built-in TypeScript support
3. **Schema Validation**: Built-in JSON Schema validation
4. **Plugin System**: More structured plugin system
5. **Modern Architecture**: Built with modern Node.js practices
6. **Async/Await**: Better async/await support out of the box
7. **Middleware**: More performant middleware system
8. **Security**: Better security defaults

## Review Checklist

Before submitting code:

1. Follows functional programming principles
2. No side effects in business logic
3. All functions are pure (except designated areas)
4. No classes used (except for types)
5. File size under 200 lines
6. All tests passing
7. Documentation complete
8. Events properly typed
9. Error handling comprehensive
10. Security considerations addressed
