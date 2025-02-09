# School Registration System Components

## System Architecture Class Diagram

```mermaid
classDiagram
    %% Core Libraries
    class Logger {
        +createLogger()
        +createRequestLogger()
        +logError()
        +logInfo()
        +logWarning()
        +logDebug()
    }

    class Common {
        +createErrorHandler()
        +createValidator()
        +createUtils()
        +handleAsync()
        +generatePassword()
        +generateOTP()
    }

    class Events {
        +createEventBus()
        +publish()
        +subscribe()
        +unsubscribe()
    }

    class Types {
        <<interface>>
        +SchoolType
        +UserType
        +ErrorType
        +EventType
        +RequestType
        +OTPType
        +KYCType
        +VerificationType
    }

    class APIGateway {
        +validateRequest()
        +sanitizeRequest()
        +checkRateLimit()
        +validateJWT()
        +routeRequest()
        +handleResponse()
        +handleError()
        +validateLocation()
        +validateDevice()
        +validateTimeAccess()
    }

    class Middleware {
        +authMiddleware()
        +validationMiddleware()
        +requestLoggerMiddleware()
        +errorHandlerMiddleware()
        +locationMiddleware()
        +deviceMiddleware()
        +timeAccessMiddleware()
    }

    class ABAC {
        +createAbacMiddleware()
        +checkPermission()
        +validateAccess()
        +getRoles()
        +addRole()
        +checkTimeRestrictions()
        +checkLocationRestrictions()
        +checkDeviceRestrictions()
    }

    class Constants {
        +ERROR_CODES
        +EVENT_TYPES
        +ROLES
        +PERMISSIONS
        +RATE_LIMITS
        +OTP_TYPES
        +VERIFICATION_STATUSES
        +TIME_RESTRICTIONS
    }

    class Prisma {
        +SchoolModel
        +UserModel
        +DocumentModel
        +OTPModel
        +KYCModel
        +VerificationModel
        +connect()
        +disconnect()
    }

    class KYCService {
        +initiateKYC()
        +validateDocuments()
        +checkVerificationStatus()
        +setVerificationDeadline()
        +handleVerificationExpiry()
    }

    class OTPService {
        +generateOTP()
        +validateOTP()
        +getOTPOwner()
        +checkOTPType()
        +invalidateOTP()
    }

    class VerificationService {
        +verifySchool()
        +verifyOwner()
        +checkDocuments()
        +setVerificationPeriod()
        +handleVerificationTimeout()
        +restrictUnverifiedSchool()
        +restrictUnverifiedOwner()
    }

    class SchoolRegistration {
        +registerSchool()
        +validateSchool()
        +setupSchool()
        +verifySchool()
        +createOwnerAccount()
        +linkSchoolToOwner()
        +handleOTPRegistration()
        +initiateVerificationProcess()
    }

    %% Relationships
    Logger <|-- Events : uses
    Logger <|-- Common : uses
    Common <|-- Types : implements
    Common <|-- Constants : uses
    Events <|-- Types : implements
    Middleware <|-- Logger : uses
    Middleware <|-- ABAC : uses
    ABAC <|-- Types : implements
    ABAC <|-- Constants : uses
    Prisma <|-- Types : implements

    %% API Gateway Relationships
    APIGateway <|-- Logger : uses
    APIGateway <|-- ABAC : uses
    APIGateway <|-- Common : uses
    APIGateway <|-- Constants : uses
    APIGateway <|-- Types : implements
    Middleware <|-- APIGateway : routes through

    %% New Service Relationships
    KYCService <|-- Types : implements
    KYCService <|-- Events : uses
    KYCService <|-- Prisma : uses
    OTPService <|-- Common : uses
    OTPService <|-- Types : implements
    OTPService <|-- Prisma : uses
    VerificationService <|-- Events : uses
    VerificationService <|-- Types : implements
    VerificationService <|-- Prisma : uses

    %% System Dependencies
    Events --> Prisma : persists
    ABAC --> Prisma : queries
    Middleware --> Common : utilizes
    Common --> Prisma : accesses

    %% School Registration Dependencies
    SchoolRegistration --> KYCService : uses
    SchoolRegistration --> OTPService : uses
    SchoolRegistration --> VerificationService : uses
    SchoolRegistration --> ABAC : uses
    SchoolRegistration --> Events : uses
```

## System Components Description

### Core Libraries
1. **Logger**
   - Comprehensive logging system
   - Request tracking
   - Error logging
   - Performance monitoring

2. **Common**
   - Error handling utilities
   - Validation helpers
   - Async operation handlers
   - Shared utilities

3. **Events**
   - Event bus implementation
   - Pub/sub system
   - Async communication
   - Event persistence

4. **Types**
   - TypeScript type definitions
   - Interface declarations
   - Type guards
   - Generic types

### Middleware Components
1. **Middleware**
   - Authentication
   - Request validation
   - Logging middleware
   - Error handling

2. **ABAC (Attribute-Based Access Control)**
   - Permission management
   - Role-based access
   - Access validation
   - Security controls

### Support Systems
1. **Constants**
   - System-wide enums
   - Error codes
   - Event types
   - Role definitions

2. **Prisma**
   - Database models
   - CRUD operations
   - Relationships
   - Data persistence

### Main Application
**SchoolRegistration**
- Implements core registration logic
- Uses all available systems
- Handles complete registration flow
- Manages school lifecycle

## Component Interactions

- **Logger** provides logging capabilities to all components
- **Events** enables async communication between components
- **Common** provides shared utilities across the system
- **Types** ensures type safety throughout the application
- **Middleware** handles cross-cutting concerns
- **ABAC** manages security and access control
- **Prisma** handles data persistence
- **Constants** provides system-wide constants and enums 

## Registration Process Sequence

```mermaid
sequenceDiagram
    participant C as Client
    participant AG as API Gateway
    participant M as Middleware
    participant R as SchoolRegistration
    participant A as ABAC
    participant V as Validator
    participant E as Events
    participant L as Logger
    participant P as Prisma
    participant Q as EventQueue

    %% API Gateway & Initial Validation
    C->>+AG: POST /register-school
    AG->>+L: Log Incoming Request
    
    %% API Gateway Processing
    AG->>AG: Sanitize Request
    AG->>AG: Validate Request Format
    AG->>AG: Rate Limiting Check
    
    %% API Gateway Security
    AG->>AG: JWT Validation
    AG->>+A: Initial Auth Check
    A-->>-AG: Auth Status
    
    %% Request Routing
    AG->>+M: Route to School Service
    
    %% Middleware Processing
    M->>+L: Log Service Request
    M->>+A: Detailed Permission Check
    A->>-M: Permissions Granted
    
    %% Registration Process
    M->>+R: Process Registration
    R->>+V: Validate School Data
    V-->>-R: Validation Result
    
    %% Database Operations
    R->>+P: Create School Record
    P-->>-R: School Created
    R->>+P: Create Admin User
    P-->>-R: Admin Created
    
    %% Event Publishing
    R->>+E: Publish SchoolCreated
    E->>Q: Queue Event
    E-->>-R: Event Published
    
    %% Setup Process
    Q->>+E: Process SchoolCreated
    E->>+P: Initialize School Settings
    P-->>-E: Settings Created
    E->>+P: Setup Permissions
    P-->>-E: Permissions Set
    
    %% Notification
    E->>Q: Queue WelcomeEmail
    E-->>-Q: Email Queued
    
    %% Logging
    R->>+L: Log Success
    L-->>-R: Logged
    
    %% Response Chain
    R-->>-M: Registration Complete
    M-->>-AG: Service Response
    AG-->>-C: 201 Created

    %% Error Handling (Alt Flow)
    Note over C,Q: Error Handling Flow
    alt API Gateway Validation Error
        AG-->>C: 400 Bad Request
    else Rate Limit Exceeded
        AG-->>C: 429 Too Many Requests
    else Authentication Error
        AG-->>C: 401 Unauthorized
    else Validation Error
        V-->>R: Invalid Data
        R->>L: Log Error
        R-->>M: 400 Bad Request
        M-->>AG: Validation Error
        AG-->>C: 400 Bad Request
    else Permission Error
        A-->>M: Permission Denied
        M->>L: Log Error
        M-->>AG: Permission Error
        AG-->>C: 403 Forbidden
    else Database Error
        P-->>R: DB Error
        R->>L: Log Error
        R-->>M: 500 Server Error
        M-->>AG: System Error
        AG-->>C: 500 Server Error
    end
```

## Sequence Flow Description

### 1. API Gateway Processing
- Request sanitization and format validation
- Rate limiting checks
- JWT validation
- Initial authentication
- Request routing

### 2. Initial Request Processing
- Middleware processing
- Detailed permission checks
- Service-level validation
- Request logging

### 3. Core Registration
- School record creation
- Admin user setup
- Initial settings configuration
- Permission setup

### 4. Event Processing
- School creation event
- Settings initialization
- Welcome email queuing
- Notification dispatching

### 5. Error Scenarios
- Validation errors
- Permission issues
- Database failures
- System errors

### 6. Logging & Monitoring
- Request logging
- Operation tracking
- Error logging
- Performance monitoring

### 7. Response Handling
- Success response
- Error responses
- Status updates
- Client notification 

## Registration Scenarios

### Scenario 1: New User Registration
```mermaid
sequenceDiagram
    participant C as Client
    participant AG as API Gateway
    participant R as SchoolRegistration
    participant O as OTPService
    participant A as ABAC
    participant K as KYCService
    participant V as VerificationService
    participant P as Prisma
    participant E as Events

    %% Initial Request
    C->>+AG: POST /register-school (with user info)
    AG->>AG: Validate & Sanitize
    AG->>+A: Check System Admin Permission
    A-->>-AG: Authorized

    %% Create User & School
    AG->>+R: Process Registration
    R->>+P: Create User Account
    P-->>-R: User Created
    R->>Common: Generate Password
    R->>+P: Create School Record
    P-->>-R: School Created

    %% Setup Roles & Verification
    R->>+A: Add School Owner Role
    A->>P: Update User Roles
    A-->>-R: Role Added
    R->>+K: Initiate KYC Process
    K-->>-R: KYC Initiated
    R->>+V: Setup Verification Deadlines
    V-->>-R: Deadlines Set

    %% Notifications
    R->>+E: Publish Welcome Event
    E->>E: Queue Welcome Email with Credentials
    E-->>-R: Event Published

    %% Response
    R-->>-AG: Registration Complete
    AG-->>-C: 201 Created
```

### Scenario 2: Existing User Registration
```mermaid
sequenceDiagram
    participant C as Client
    participant AG as API Gateway
    participant R as SchoolRegistration
    participant O as OTPService
    participant A as ABAC
    participant K as KYCService
    participant V as VerificationService
    participant P as Prisma
    participant E as Events

    %% Initial Request with OTP
    C->>+AG: POST /register-school (with OTP)
    AG->>AG: Validate & Sanitize
    AG->>+A: Check System Admin Permission
    A-->>-AG: Authorized

    %% Validate OTP
    AG->>+R: Process Registration
    R->>+O: Validate School Creation OTP
    O->>P: Get OTP Owner
    O-->>-R: OTP Valid & Owner Found

    %% Create School & Link
    R->>+P: Create School Record
    P-->>-R: School Created
    R->>+A: Check Existing Roles
    A-->>-R: Roles Retrieved
    
    alt No School Owner Role
        R->>A: Add School Owner Role
    end
    
    R->>P: Link School to Owner

    %% Setup Verification
    R->>+K: Check KYC Status
    K-->>-R: KYC Status
    R->>+V: Setup Verification Deadlines
    V-->>-R: Deadlines Set

    %% Notifications
    R->>+E: Publish School Added Event
    E-->>-R: Event Published

    %% Response
    R-->>-AG: Registration Complete
    AG-->>-C: 201 Created
``` 