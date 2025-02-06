# EduFlow System Workflows

## Authentication & Verification Workflows

### User Registration
```mermaid
graph TD
    A[User Starts Registration] --> B[Enter Basic Info]
    B --> C[Select Role]
    C --> D[Upload KYC Documents]
    D --> E[System Verifies Documents]
    E --> F{Verification Result}
    F -->|Approved| G[Account Activated]
    F -->|Rejected| H[Request Additional Documents]
```

### Parent Verification
```mermaid
graph TD
    A[Parent Account Created] --> B[Submit ID Documents]
    B --> C[Link Children to Account]
    C --> D[Verify School Enrollment]
    D --> E[KYC Verification]
    E --> F{Verification Status}
    F -->|Verified| G[Enable Full Access]
    G --> H[Enable Tutor Search]
    F -->|Rejected| I[Request Additional Verification]
```

## Payment Workflows

### School Fee Payment
```mermaid
graph TD
    A[Parent Initiates Payment] --> B[Choose Payment Method]
    B -->|Mobile Money| C1[Redirect to Provider]
    B -->|Wallet| C2[Check Balance]
    C1 --> D1[Process Payment]
    C2 -->|Sufficient| D2[Deduct from Wallet]
    C2 -->|Insufficient| E[Top up Wallet]
    D1 --> F[Update Fee Status]
    D2 --> F
    F --> G[Send Receipt]
```

### Wallet Management
```mermaid
graph TD
    A[Parent Funds Wallet] --> B[Choose Mobile Money Provider]
    B --> C[Process Deposit]
    C --> D[Update Wallet Balance]
    D --> E[Enable Auto-deduct if Set]
    E --> F[Send Confirmation]
```

### Quiz Payment
```mermaid
graph TD
    A[Student Selects Quiz] --> B[Check Parent Settings]
    B -->|Auto-approve| C1[Process Payment]
    B -->|Manual| C2[Request Parent Approval]
    C2 --> D[Parent Reviews]
    D -->|Approved| C1
    C1 --> E[Start Quiz]
    E --> F[Complete Quiz]
    F --> G[Process Teacher Revenue]
```

## Academic Workflows

### Quiz Creation & Management
```mermaid
graph TD
    A[Teacher Creates Quiz] --> B[Set Questions & Answers]
    B --> C[Set Price & Grade Level]
    C --> D[Submit for Verification]
    D --> E{System Review}
    E -->|Approved| F[Quiz Published]
    E -->|Rejected| G[Revision Required]
```

### Home Tutoring
```mermaid
graph TD
    A[Teacher Sets Availability] --> B[Update Teaching Profile]
    B --> C[Verified Parent Searches]
    C --> D[Parent Requests Interview]
    D --> E[Teacher Confirms]
    E --> F[Schedule Interview]
    F --> G[Process Interview Payment]
```

## Communication Workflows

### School Head Communications
```mermaid
graph TD
    A[School Head Initiates Message] --> B[Select Audience Type]
    B -->|Staff| C1[Create Staff Broadcast]
    B -->|Parents| C2[Filter Parent Group]
    B -->|All| C3[School-wide Broadcast]
    C1 --> D[Send Notifications]
    C2 --> E[Target Specific Parents]
    C3 --> D
    E --> D
```

### Fee Payment Reminders
```mermaid
graph TD
    A[System Checks Due Dates] --> B[Identify Pending Payments]
    B --> C[Generate Reminders]
    C --> D[Check Notification Preferences]
    D --> E[Send SMS]
    D --> F[Send In-App Notice]
    D --> G[Send Email]
```

## Administrative Workflows

### School Setup
```mermaid
graph TD
    A[System Admin Initiates School Creation] --> B[Collect School Documentation]
    B --> C[KYC Verification]
    C --> D[System Verifies School Documents]
    D -->|Approved| E[Link School Owner]
    E --> F[System Assigns School Head]
    F --> G[Configure School Settings]
    G --> H[Set Fee Structure]
    H --> I[School Activated]
    D -->|Rejected| J[Request Additional Documentation]
```

### Staff Management
```mermaid
graph TD
    A[Add New Staff] --> B[Verify Credentials]
    B --> C[KYC Check]
    C --> D[Role Assignment]
    D --> E[System Access Setup]
    E --> F[Communication Channel Access]
```

## Parent Control Workflows

### Quiz Authorization
```mermaid
graph TD
    A[Set Quiz Preferences] --> B[Configure Auto-approval]
    B --> C[Set Spending Limits]
    C --> D[Define Subject Restrictions]
    D --> E[Set Daily Quiz Limits]
```

### Payment Preferences
```mermaid
graph TD
    A[Configure Payment Settings] --> B[Set Default Method]
    B --> C[Enable/Disable Auto-pay]
    C --> D[Set Payment Thresholds]
    D --> E[Configure Notifications]
```

## System Integration Workflows

### Mobile Money Integration
```mermaid
graph TD
    A[Payment Initiated] --> B[Select Provider]
    B --> C[Generate Payment Request]
    C --> D[Provider Processing]
    D --> E[Callback Received]
    E --> F[Update Transaction Status]
    F --> G[Trigger Related Actions]
```

### Document Verification
```mermaid
graph TD
    A[Document Uploaded] --> B[Initial Validation]
    B --> C[Store Securely]
    C --> D[Queue for Verification]
    D --> E[Process Verification]
    E --> F[Update Status]
    F --> G[Notify User]
```

## Revenue Sharing Workflows

### Quiz Revenue Distribution
```mermaid
graph TD
    A[Quiz Completed] --> B[Calculate Total Revenue]
    B --> C[Apply Platform Fee]
    C --> D[Calculate Teacher Share]
    D --> E[Process Distributions]
    E --> F[Generate Reports]
```

### Tutor Payment Processing
```mermaid
graph TD
    A[Session Completed] --> B[Calculate Payment]
    B --> C[Apply Platform Fee]
    C --> D[Process Tutor Payment]
    D --> E[Update Records]
    E --> F[Send Notifications]
``` 