# Service Interaction Flows

This document illustrates how the Auth Service, Common Auth middleware, and User Service work together in various flows.

## Service Interaction Sequence

```mermaid
sequenceDiagram
    participant C as Client
    participant AS as Auth Service
    participant CA as Common Auth
    participant US as User Service
    participant DB as Database
    participant ES as Event System

    %% Registration & Profile Creation Flow
    rect rgba(230, 240, 255, 0.5)
        Note over C,ES: Registration Flow
        C->>+AS: POST /auth/register
        AS->>DB: Check email exists
        DB-->>AS: No duplicate
        AS->>DB: Create user
        DB-->>AS: User created
        AS->>ES: Publish USER_CREATED
        AS-->>-C: 201 Created (user)

        ES->>+US: Handle USER_CREATED
        US->>DB: Create base profile
        DB-->>US: Profile created
        US->>ES: Publish PROFILE_CREATED
        US-->>-ES: Handled
    end

    %% Authentication & Protected Access Flow
    rect rgba(230, 255, 240, 0.5)
        Note over C,US: Authentication & Access Flow
        C->>+AS: POST /auth/login
        AS->>DB: Verify credentials
        DB-->>AS: User verified
        AS->>AS: Generate JWT & refresh token
        AS-->>-C: 200 OK (tokens)

        C->>+US: GET /users/:id/profile
        US->>CA: Validate request
        CA->>CA: Verify JWT
        CA->>CA: Check ABAC policies
        CA-->>US: Access granted
        US->>DB: Get profile
        DB-->>US: Profile data
        US-->>-C: 200 OK (profile)
    end

    %% Token Refresh & Session Management
    rect rgba(255, 245, 230, 0.5)
        Note over C,AS: Token Management Flow
        C->>+AS: POST /auth/refresh
        AS->>DB: Validate refresh token
        DB-->>AS: Token valid
        AS->>AS: Generate new tokens
        AS-->>-C: 200 OK (new tokens)

        Note over C,US: Subsequent Requests
        C->>+US: PATCH /users/:id/profile
        US->>CA: Validate request
        CA->>CA: Verify new JWT
        CA->>CA: Check ABAC policies
        CA-->>US: Access granted
        US->>DB: Update profile
        DB-->>US: Updated data
        US->>ES: Publish PROFILE_UPDATED
        US-->>-C: 200 OK (profile)
    end

    %% Logout & Cleanup Flow
    rect rgba(255, 230, 240, 0.5)
        Note over C,ES: Logout Flow
        C->>+AS: POST /auth/logout
        AS->>DB: Invalidate refresh token
        DB-->>AS: Token invalidated
        AS->>ES: Publish USER_LOGGED_OUT
        AS-->>-C: 200 OK

        ES->>+US: Handle USER_LOGGED_OUT
        US->>DB: Update last activity
        DB-->>US: Updated
        US-->>-ES: Handled
    end
```

## Component Responsibilities

1. **Auth Service**
   - User registration and authentication
   - Token issuance and management
   - Session management
   - Credential verification
   - Event publishing for auth events

2. **Common Auth (Middleware)**
   - Token validation
   - ABAC policy enforcement
   - Permission checking
   - Role validation
   - Security context management

3. **User Service**
   - Profile management
   - User data storage
   - Event handling for user lifecycle
   - Profile metadata management
   - Data validation and sanitization

## Integration Points

1. **Event-Based Integration**
   - Auth Service → User Service (user lifecycle events)
   - User Service → Auth Service (profile status updates)
   - Both services → Event System (audit and tracking)

2. **Security Integration**
   - Auth Service issues tokens
   - Common Auth validates tokens
   - User Service protected by Common Auth
   - All services share security context

3. **Data Flow**
   - Auth Service manages credentials
   - User Service manages profile data
   - Common Auth ensures secure access
   - Event System ensures consistency

## Security Considerations

1. **Token Security**
   - Short-lived access tokens
   - Secure refresh token rotation
   - Token validation at every request
   - Secure token storage

2. **Access Control**
   - Multi-layer security (Auth + ABAC)
   - Fine-grained permissions
   - Context-aware access control
   - Role-based restrictions

3. **Data Protection**
   - Secure credential storage
   - Profile data encryption
   - Audit logging
   - Session monitoring 