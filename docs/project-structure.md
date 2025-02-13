# EduFlow Project Structure

## Root Directory Structure

```
eduflow/
├── apps/                    # Service applications
│   ├── auth-service/
│   ├── user-service/
│   ├── school-service/
│   └── ...
├── libs/                    # Shared libraries
│   ├── common/             # Common utilities
│   ├── types/              # Shared TypeScript types
│   ├── validators/         # Shared validation rules
│   ├── middleware/         # Shared middleware
│   └── constants/          # Shared constants
├── packages/               # Shared packages
│   ├── eslint-config/     # Shared ESLint config
│   ├── tsconfig/          # Shared TypeScript config
│   └── jest-config/       # Shared Jest config
└── tools/                 # Development tools
    ├── generators/        # Code generators
    └── scripts/           # Build/deployment scripts
```

## Core Configuration Files

```
eduflow/
├── .npmrc                  # pnpm configuration
├── package.json           # Root package.json
├── pnpm-workspace.yaml    # Workspace configuration
├── tsconfig.json         # Base TypeScript config
├── .eslintrc.js          # Base ESLint config
└── jest.config.js        # Base Jest config
```

## Shared Library Structure (libs/)

Each shared library follows a consistent structure:

```
libs/[library-name]/
├── src/
│   ├── index.ts           # Public API
│   └── [feature]/         # Feature-specific code
├── package.json
├── tsconfig.json
└── README.md
```

## Service Structure (apps/)

Each service follows a consistent structure:

```
apps/[service-name]/
├── src/
│   ├── config/           # Service configuration
│   ├── controllers/      # Route controllers
│   ├── events/          # Event handlers & publishers
│   ├── models/          # Domain models
│   ├── repositories/    # Data access layer
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── types/           # Service-specific types
│   ├── utils/           # Service-specific utilities
│   └── index.ts         # Service entry point
├── test/                # Tests
├── package.json
├── tsconfig.json
└── README.md
```

## Development Rules & Standards

### Code Organization

- Maximum 200 lines per file
- Functional programming only
- Pure functions preferred
- Immutable data structures
- No classes (use functional composition)

### TypeScript Configuration

```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "strictFunctionTypes": true,
  "noImplicitThis": true,
  "noImplicitReturns": true
}
```

### Testing Requirements

- Unit tests for all pure functions
- Integration tests for API endpoints
- E2E tests for critical flows
- Minimum 80% coverage

### Code Style

- Prettier for formatting
- ESLint for linting
- Conventional commits

### Documentation

- TSDoc for all functions
- OpenAPI/Swagger for APIs
- Event documentation
- README for each package/service

## Shared Packages

### @eduflow/common

- Error handling
- Logging
- Date utilities
- String utilities
- Security utilities

### @eduflow/types

- Domain types
- DTO types
- Event types
- Enum types

### @eduflow/validators

- Input validation
- Schema validation
- Business rule validation

### @eduflow/middleware

- Authentication
- Authorization
- Request validation
- Error handling
- Logging
- Rate limiting

### @eduflow/constants

- Error codes
- Status codes
- Configuration constants
- Feature flags

## Development Tools

### Code Generators

- Service scaffolding
- Event handler generation
- Test file generation
- API endpoint generation

### Build Scripts

- Build configuration
- Development environment setup
- Production deployment
- Database migration

## Getting Started

1. Install pnpm: `npm install -g pnpm`
2. Clone repository
3. Run: `pnpm install`
4. Run: `pnpm build`
5. Run: `pnpm dev`

## Development Workflow

1. Create feature branch
2. Implement changes
3. Run tests: `pnpm test`
4. Run linting: `pnpm lint`
5. Submit PR
