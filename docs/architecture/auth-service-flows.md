# Auth Service Flows

This document outlines the key authentication flows in the auth service.

## Authentication Flow Sequence

```mermaid
sequenceDiagram
    participant C as Client
    participant AS as Auth Service
    participant R as Redis
    participant DB as Database
    participant OS as Other Services

    %% Registration Flow
    rect rgba(230, 240, 255, 0.5)
        Note over C,DB: Registration Flow
        C->>+AS: POST /auth/register
        AS->>DB: Check email exists
        DB-->>AS: No duplicate
        AS->>DB: Create user
        DB-->>AS: User created
        AS-->>-C: 201 Created
    end

    %% Login Flow
    rect rgba(230, 255, 240, 0.5)
        Note over C,OS: Login Flow
        C->>+AS: POST /auth/login
        AS->>DB: Find user by email
        DB-->>AS: User found
        AS->>AS: Verify password
        AS->>AS: Check KYC/Employment status
        AS->>AS: Generate JWT
        AS->>R: Store refresh token
        AS->>R: Create session
        AS-->>-C: 200 OK (tokens)
    end

    %% Token Refresh Flow
    rect rgba(255, 245, 230, 0.5)
        Note over C,OS: Token Refresh Flow
        C->>+AS: POST /auth/refresh
        AS->>R: Validate refresh token
        R-->>AS: Token valid
        AS->>DB: Get user
        DB-->>AS: User data
        AS->>AS: Generate new tokens
        AS->>R: Update session
        AS-->>-C: 200 OK (new tokens)
    end

    %% Logout Flow
    rect rgba(255, 230, 240, 0.5)
        Note over C,R: Logout Flow
        C->>+AS: POST /auth/logout
        AS->>R: Delete refresh token
        AS->>R: Delete session
        AS-->>-C: 200 OK
    end

    %% Token Verification (Other Services)
    rect rgba(240, 255, 230, 0.5)
        Note over OS,AS: Token Verification
        OS->>+AS: Verify JWT
        AS->>AS: Validate signature
        AS->>AS: Check claims
        AS-->>-OS: Token valid/invalid
    end
```

## Key Features

1. **Rate Limiting**
   - Login: 5 attempts per 15 minutes
   - Registration: 3 attempts per hour
   - Token refresh: 10 attempts per 15 minutes

2. **Security Measures**
   - Secure password hashing with Argon2
   - JWT with role-based permissions
   - Refresh token rotation
   - HTTP-only cookies
   - Session tracking

3. **Role-Based Access**
   - Staff role verification
   - KYC status checks
   - Employment eligibility validation

4. **Session Management**
   - IP tracking
   - User agent tracking
   - Activity timestamps
   - Concurrent session control

## Integration Points

1. **Redis Integration**
   - Refresh token storage
   - Session management
   - Rate limiting

2. **Database Integration**
   - User management
   - Credential storage
   - Role and permission storage

3. **Cross-Service Communication**
   - JWT verification
   - User identity propagation
   - Role and permission distribution 