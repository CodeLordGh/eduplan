# User Service Flows

This document outlines the key user management flows in the user service.

## User Service Flow Sequence

```mermaid
sequenceDiagram
    participant C as Client
    participant US as User Service
    participant DB as Database
    participant ES as Event System
    participant OS as Other Services

    %% Profile Management Flow
    rect rgba(230, 240, 255, 0.5)
        Note over C,OS: Profile Management
        C->>+US: GET /users/:userId/profile
        US->>DB: Get profile
        DB-->>US: Profile data
        US-->>-C: 200 OK (profile)

        C->>+US: POST /users/:userId/profile
        US->>US: Validate profile data
        US->>DB: Create/Update profile
        DB-->>US: Updated profile
        US->>ES: Publish PROFILE_CREATED/UPDATED
        US-->>-C: 201/200 OK (profile)

        C->>+US: PATCH /users/:userId/profile
        US->>US: Validate updates
        US->>DB: Update profile
        DB-->>US: Updated profile
        US->>ES: Publish PROFILE_UPDATED
        US-->>-C: 200 OK (profile)

        C->>+US: DELETE /users/:userId/profile
        US->>DB: Delete profile
        DB-->>US: Confirmation
        US->>ES: Publish PROFILE_DELETED
        US-->>-C: 204 No Content
    end

    %% Event-Driven Flows
    rect rgba(230, 255, 240, 0.5)
        Note over ES,DB: Event Handlers
        OS->>+US: USER_CREATED event
        US->>DB: Check profile exists
        DB-->>US: No profile
        US->>DB: Create base profile
        DB-->>US: Profile created
        US->>ES: Publish PROFILE_CREATED
        US-->>-OS: Handled

        OS->>+US: USER_DELETED event
        US->>DB: Delete profile
        DB-->>US: Confirmation
        US->>ES: Publish PROFILE_DELETED
        US-->>-OS: Handled

        OS->>+US: KYC_VERIFIED event
        US->>DB: Update profile metadata
        DB-->>US: Updated profile
        US->>ES: Publish PROFILE_UPDATED
        US-->>-OS: Handled
    end

    %% Profile Listing Flow
    rect rgba(255, 245, 230, 0.5)
        Note over C,DB: Profile Listing
        C->>+US: GET /users/profiles?page=1&limit=10
        US->>DB: Get paginated profiles
        DB-->>US: Profile list
        US-->>-C: 200 OK (profiles)
    end
```

## Key Features

1. **Profile Management**
   - Create/Update profiles
   - Partial profile updates
   - Profile deletion
   - Profile retrieval
   - Paginated profile listing

2. **Event-Driven Updates**
   - User creation handling
   - User deletion handling
   - KYC verification handling
   - Profile event publishing

3. **Data Validation**
   - Profile schema validation
   - Partial update validation
   - Occupation validation

4. **Integration Features**
   - Event system integration
   - Database transactions
   - Error handling
   - Pagination support

## Integration Points

1. **Database Integration**
   - Profile CRUD operations
   - Transaction management
   - Pagination queries

2. **Event System Integration**
   - Event publishing
   - Event handling
   - Event-driven updates

3. **Service Integration**
   - Auth service integration
   - KYC service integration
   - School service integration

## Error Handling

1. **HTTP Errors**
   - 400: Validation errors
   - 404: Profile not found
   - 500: Internal server errors

2. **Business Logic Errors**
   - Duplicate profiles
   - Invalid updates
   - Missing dependencies

3. **Event Handling Errors**
   - Event validation
   - Event processing
   - Event publishing 