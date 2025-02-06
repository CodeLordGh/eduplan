# EduFlow Development Plan (Unified)

## Development Rules & Standards
- Functional programming only
- Maximum 200 lines per file
- CQRS pattern implementation
- Event-driven architecture
- Clean Architecture principles
- Comprehensive unit and integration tests
- TypeScript strict mode enabled

## Module Management Strategy
- Shared utilities in `libs/` directory
- Common types in `libs/types`
- Shared validation rules in `libs/validators`
- Common middleware in `libs/middleware`
- Shared constants in `libs/constants`
- Database migrations in `libs/migrations`

## Service Architecture

### API Gateway Service
```typescript
// Primary responsibilities:
- Request routing
- Rate limiting
- Request validation
- Authentication verification
- API documentation (OpenAPI)
- Request/Response logging
- CORS handling
- Error standardization

// Dependencies:
- Auth Service (token verification)
- All other services (routing)
```

### Auth Service
```typescript
// Primary responsibilities:
- User authentication
- OTP management
- Role-based access control
- Token management
- Session handling
- KYC status verification
- Employment eligibility checking
- Social platform access control

// Events Published:
- USER_CREATED
- USER_UPDATED
- USER_DELETED
- LOGIN_ATTEMPTED
- OTP_GENERATED
- EMPLOYMENT_STATUS_CHANGED
- ACCESS_LEVEL_UPDATED

// Events Consumed:
- KYC_VERIFIED (from KYC)
- KYC_REJECTED (from KYC)
- EMPLOYMENT_ELIGIBILITY_UPDATED (from KYC)

// Database Schema:
users
  - id: uuid
  - email: string
  - role: Role
  - status: UserStatus
  - createdAt: timestamp
  - updatedAt: timestamp

otps
  - id: uuid
  - code: string
  - userId: uuid
  - expiresAt: timestamp
  - status: OTPStatus

employment_eligibility
  - id: uuid
  - userId: uuid
  - status: EligibilityStatus
  - verificationId: uuid
  - metadata: jsonb
```

### User Service
```typescript
// Primary responsibilities:
- User profile management
- Role hierarchy management
- User relationships
- History tracking
- Professional profile management
- Social connections management
- Employment history

// Events Published:
- PROFILE_UPDATED
- USER_ASSIGNED_TO_SCHOOL
- USER_REMOVED_FROM_SCHOOL

// Events Consumed:
- USER_CREATED (from Auth)
- USER_DELETED (from Auth)
- SCHOOL_CREATED (from School)
- KYC_VERIFIED (from KYC)
- KYC_REJECTED (from KYC)
- POST_CREATED (from Social)
- CONNECTION_UPDATED (from Social)
- CHAT_CREATED (from Chat)

// Database Schema:
profiles
  - id: uuid
  - userId: uuid
  - firstName: string
  - lastName: string
  - contact: jsonb
  - metadata: jsonb

user_relationships
  - id: uuid
  - userId: uuid
  - relatedUserId: uuid
  - type: RelationType
  - metadata: jsonb

professional_profiles
  - id: uuid
  - userId: uuid
  - experience: jsonb[]
  - certifications: jsonb[]
  - skills: string[]
  - metadata: jsonb

employment_history
  - id: uuid
  - userId: uuid
  - schoolId: uuid
  - position: string
  - startDate: timestamp
  - endDate: timestamp?
  - verificationStatus: VerificationStatus

// Additional Schema:
parent_profiles
  - id: uuid
  - userId: uuid
  - verificationStatus: VerificationStatus
  - verifiedAt: timestamp?
  - children: jsonb[]
  - preferredPaymentMethod: PaymentMethod
  - autoPaymentEnabled: boolean
  - tutorSearchEnabled: boolean // Only true if verified
  - paymentSettings: jsonb
  - metadata: jsonb

parent_settings
  - id: uuid
  - userId: uuid
  - quizAutoApproval: boolean
  - quizApprovalLimit: decimal?
  - allowedSubjects: string[]
  - maxQuizzesPerDay: integer
  - tutorPreferences: jsonb
  - paymentPreferences: jsonb
  - autoDeductSettings: jsonb
  - notificationSettings: jsonb
```

### KYC Service
```typescript
// Primary responsibilities:
- Document verification
- Identity validation
- School verification
- Employment eligibility checking
- Verification status tracking

// Events Published:
- KYC_SUBMITTED
- KYC_VERIFIED
- KYC_REJECTED
- SCHOOL_VERIFIED
- EMPLOYMENT_ELIGIBILITY_UPDATED

// Events Consumed:
- USER_CREATED (from Auth)
- SCHOOL_CREATED (from School)
- STAFF_ASSIGNED (from School)
- PROFILE_UPDATED (from User)
- SCHOOL_UPDATED (from School)
- FILE_UPLOADED (from File)

// Database Schema:
kyc_documents
  - id: uuid
  - userId: uuid
  - type: DocumentType
  - status: VerificationStatus
  - documentUrls: string[]
  - verifiedAt: timestamp
  - metadata: jsonb

verification_history
  - id: uuid
  - entityId: uuid
  - entityType: 'USER' | 'SCHOOL'
  - status: VerificationStatus
  - verifiedBy: uuid
  - notes: text
```

### School Service
```typescript
// Primary responsibilities:
- School management (system admin only)
- Department/Class management
- Staff assignment
- School settings
- Communication group management
- Role-based access control

// Events Published:
- SCHOOL_CREATED (by system only)
- SCHOOL_UPDATED
- CLASS_CREATED
- STAFF_ASSIGNED
- SCHOOL_ROLE_ASSIGNED
- COMMUNICATION_GROUP_CREATED
- COMMUNICATION_GROUP_UPDATED

// Events Consumed:
- USER_CREATED (from Auth)
- PROFILE_UPDATED (from User)
- KYC_VERIFIED (from KYC)
- SCHOOL_VERIFIED (from KYC)
- EMPLOYMENT_ELIGIBILITY_UPDATED (from KYC)
- CONNECTION_UPDATED (from Social)
- BROADCAST_MESSAGE_SENT (from Chat)

// Database Schema:
schools
  - id: uuid
  - name: string
  - type: SchoolType
  - status: SchoolStatus
  - settings: jsonb
  - communicationSettings: jsonb
  - createdBy: uuid // Must be a system admin
  - verificationStatus: VerificationStatus
  - ownershipDetails: jsonb // Details about school ownership
  - systemApproval: jsonb // System approval details

classes
  - id: uuid
  - schoolId: uuid
  - name: string
  - grade: string
  - academicYear: string

communication_groups
  - id: uuid
  - schoolId: uuid
  - name: string
  - type: GroupType
  - filters: jsonb
  - metadata: jsonb

school_roles
  - id: uuid
  - schoolId: uuid
  - userId: uuid
  - role: SchoolRole
  - permissions: string[]
  - communicationPermissions: string[]
  - assignedBy: uuid // Must be a system admin for owner role
```

### Academic Service
```typescript
// Primary responsibilities:
- Grade management
- Performance tracking
- Assignment management
- AI-assisted assessment
- Quiz management and monetization
- Home tutoring management
- Teacher availability tracking

// Events Published:
- GRADE_RECORDED
- ASSIGNMENT_CREATED
- PERFORMANCE_UPDATED
- QUIZ_CREATED
- QUIZ_COMPLETED
- TUTOR_AVAILABILITY_UPDATED
- TUTOR_APPLICATION_SUBMITTED
- TUTOR_INTERVIEW_REQUESTED

// Events Consumed:
- CLASS_CREATED (from School)
- STAFF_ASSIGNED (from School)
- KYC_VERIFIED (from KYC)
- POST_CREATED (from Social)
- MESSAGE_SENT (from Chat)
- PAYMENT_PROCESSED (from Payment)
- QUIZ_PAYMENT_APPROVED (from Payment)

// Database Schema:
grades
  - id: uuid
  - studentId: uuid
  - subjectId: uuid
  - score: number
  - type: GradeType
  - metadata: jsonb

assignments
  - id: uuid
  - classId: uuid
  - teacherId: uuid
  - title: string
  - description: text
  - dueDate: timestamp

quizzes
  - id: uuid
  - teacherId: uuid
  - title: string
  - description: text
  - subject: string
  - gradeLevel: string[]
  - price: decimal
  - duration: integer
  - status: QuizStatus
  - verificationStatus: VerificationStatus
  - metadata: jsonb

quiz_questions
  - id: uuid
  - quizId: uuid
  - question: text
  - options: jsonb
  - correctAnswer: string
  - points: integer
  - explanation: text?

quiz_attempts
  - id: uuid
  - quizId: uuid
  - studentId: uuid
  - startedAt: timestamp
  - completedAt: timestamp?
  - score: number?
  - paymentId: uuid
  - parentApproval: boolean
  - status: AttemptStatus

tutor_profiles
  - id: uuid
  - userId: uuid
  - subjects: string[]
  - gradeLevels: string[]
  - hourlyRate: decimal
  - availability: jsonb
  - homeTeachingRadius: integer // in kilometers
  - verificationStatus: VerificationStatus
  - rating: decimal
  - totalStudents: integer
  - metadata: jsonb

tutor_availability
  - id: uuid
  - tutorId: uuid
  - availableFrom: timestamp
  - availableTo: timestamp
  - type: 'HOME_TEACHING' | 'ONLINE'
  - status: AvailabilityStatus
  - location: jsonb?

tutor_applications
  - id: uuid
  - parentId: uuid
  - tutorId: uuid
  - studentId: uuid
  - status: ApplicationStatus
  - proposedSchedule: jsonb
  - subjects: string[]
  - location: jsonb
  - notes: text
  - interviewDate: timestamp?
  - parentVerified: boolean // Must be true to proceed
  - paymentVerified: boolean
```

### Payment Service
```typescript
// Primary responsibilities:
- Payment processing
- Transaction management
- Fee tracking
- Invoice generation
- Quiz payment management
- Tutor payment processing
- Revenue sharing
- School fee management
- Wallet management (optional)
- Mobile money integration
- Payment reconciliation

// Events Published:
- PAYMENT_PROCESSED
- PAYMENT_FAILED
- INVOICE_GENERATED
- QUIZ_PAYMENT_APPROVED
- TUTOR_PAYMENT_PROCESSED
- PLATFORM_REVENUE_RECORDED
- WALLET_FUNDED
- SCHOOL_FEE_PAID
- FEEDING_FEE_PAID
- SUPPLIES_PURCHASED

// Events Consumed:
- USER_CREATED (from Auth)
- SCHOOL_CREATED (from School)
- KYC_VERIFIED (from KYC)
- SCHOOL_VERIFIED (from KYC)
- QUIZ_COMPLETED (from Academic)
- TUTOR_APPLICATION_SUBMITTED (from Academic)

// Database Schema:
transactions
  - id: uuid
  - userId: uuid
  - amount: decimal
  - type: TransactionType // Extended with QUIZ_PAYMENT, TUTOR_PAYMENT, SCHOOL_FEE, FEEDING_FEE, SUPPLIES
  - paymentMethod: PaymentMethod // MOBILE_MONEY, WALLET, BANK
  - provider: string? // Mobile money provider if applicable
  - status: TransactionStatus
  - metadata: jsonb
  - reference: string
  - externalReference: string?

wallets
  - id: uuid
  - userId: uuid
  - balance: decimal
  - status: WalletStatus
  - lastFundedAt: timestamp
  - autoDeductEnabled: boolean
  - minimumBalance: decimal?

wallet_transactions
  - id: uuid
  - walletId: uuid
  - amount: decimal
  - type: 'CREDIT' | 'DEBIT'
  - transactionId: uuid
  - balanceBefore: decimal
  - balanceAfter: decimal
  - status: TransactionStatus
  - metadata: jsonb

school_fees
  - id: uuid
  - schoolId: uuid
  - studentId: uuid
  - termId: uuid
  - amount: decimal
  - type: FeeType // TUITION, FEEDING, SUPPLIES, etc.
  - dueDate: timestamp
  - status: FeeStatus
  - metadata: jsonb

fee_payments
  - id: uuid
  - feeId: uuid
  - amount: decimal
  - paymentMethod: PaymentMethod
  - transactionId: uuid
  - status: PaymentStatus
  - paidAt: timestamp
  - metadata: jsonb

payment_providers
  - id: uuid
  - name: string
  - type: 'MOBILE_MONEY' | 'BANK'
  - country: string
  - config: jsonb
  - status: ProviderStatus
  - metadata: jsonb

payment_settings
  - id: uuid
  - userId: uuid
  - type: 'PARENT' | 'TEACHER'
  - autoApproveLimit: decimal?
  - paymentMethods: jsonb[]
  - defaultMethod: string?
  - notificationPreferences: jsonb
  - autoDeductPreferences: jsonb
```

### Social Service
```typescript
// Primary responsibilities:
- Post management (Hub & B-Hub)
- Comments and reactions
- Content moderation
- Social connections
- Professional networking

// Events Published:
- POST_CREATED
- COMMENT_ADDED
- REACTION_ADDED
- CONNECTION_REQUESTED
- CONNECTION_UPDATED

// Events Consumed:
- USER_CREATED (from Auth)
- KYC_VERIFIED (from KYC)
- SCHOOL_VERIFIED (from KYC)
- PROFILE_UPDATED (from User)
- GRADE_RECORDED (from Academic)
- FILE_UPLOADED (from File)
- NOTIFICATION_SENT (from Notification)

// Database Schema:
posts
  - id: uuid
  - userId: uuid
  - content: jsonb
  - type: PostType
  - visibility: Visibility
  - metadata: jsonb

comments
  - id: uuid
  - postId: uuid
  - userId: uuid
  - content: text
  - parentId: uuid?

reactions
  - id: uuid
  - entityId: uuid
  - entityType: 'POST' | 'COMMENT'
  - userId: uuid
  - type: ReactionType

connections
  - id: uuid
  - requesterId: uuid
  - receiverId: uuid
  - status: ConnectionStatus
  - metadata: jsonb
```

### Chat Service
```typescript
// Primary responsibilities:
- Direct messaging
- Group chats
- Message history
- Read receipts
- Media sharing
- Secure communication channels for school management
- Role-based chat access control
- School-specific communication channels
- Broadcast messaging for school heads

// Events Published:
- MESSAGE_SENT
- MESSAGE_DELIVERED
- MESSAGE_READ
- CHAT_CREATED
- PARTICIPANT_ADDED
- SECURE_CHANNEL_CREATED
- BROADCAST_MESSAGE_SENT
- TARGETED_MESSAGE_SENT

// Events Consumed:
- USER_CREATED (from Auth)
- USER_DELETED (from Auth)
- SCHOOL_CREATED (from School)
- PROFILE_UPDATED (from User)
- KYC_VERIFIED (from KYC)
- SCHOOL_VERIFIED (from KYC)
- FILE_UPLOADED (from File)
- NOTIFICATION_SENT (from Notification)
- PAYMENT_FAILED (from Payment)
- SCHOOL_ROLE_ASSIGNED (from School)

// Database Schema:
chats
  - id: uuid
  - type: ChatType // Extended with SECURE_MANAGEMENT, BROADCAST, TARGETED_GROUP
  - schoolId: uuid?
  - metadata: jsonb
  - visibility: ChatVisibility
  - accessControl: jsonb

chat_participants
  - id: uuid
  - chatId: uuid
  - userId: uuid
  - role: ParticipantRole
  - status: ParticipantStatus
  - schoolRole: SchoolRole?

messages
  - id: uuid
  - chatId: uuid
  - senderId: uuid
  - content: jsonb
  - type: MessageType
  - status: MessageStatus
  - targetGroup: string?
  - priority: MessagePriority
  - expiresAt: timestamp?

message_recipients
  - id: uuid
  - messageId: uuid
  - recipientId: uuid
  - recipientType: 'USER' | 'GROUP' | 'ROLE'
  - readAt: timestamp?
  - deliveredAt: timestamp?

broadcast_groups
  - id: uuid
  - schoolId: uuid
  - name: string
  - type: BroadcastGroupType // STAFF, PARENTS, ALL, CUSTOM
  - filters: jsonb // For targeting specific groups (e.g., late fee parents)
  - createdBy: uuid
```

### Notification Service
```typescript
// Primary responsibilities:
- Real-time notifications
- Email notifications
- SMS notifications
- Notification preferences
- Priority notifications for school management
- Targeted group notifications
- School-wide announcements
- Payment reminder notifications

// Events Published:
- NOTIFICATION_SENT
- NOTIFICATION_FAILED
- BROADCAST_NOTIFICATION_SENT
- TARGETED_NOTIFICATION_SENT

// Events Consumed:
- All events requiring notifications
- KYC_SUBMITTED (from KYC)
- KYC_VERIFIED (from KYC)
- KYC_REJECTED (from KYC)
- POST_CREATED (from Social)
- COMMENT_ADDED (from Social)
- REACTION_ADDED (from Social)
- MESSAGE_SENT (from Chat)
- MESSAGE_DELIVERED (from Chat)
- BROADCAST_MESSAGE_SENT (from Chat)
- TARGETED_MESSAGE_SENT (from Chat)
- PAYMENT_FAILED (from Payment)
- PAYMENT_REMINDER_NEEDED (from Payment)

// Database Schema:
notifications
  - id: uuid
  - userId: uuid
  - type: NotificationType
  - content: jsonb
  - status: NotificationStatus
  - priority: NotificationPriority
  - schoolId: uuid?
  - targetGroup: string?
  - expiresAt: timestamp?

notification_preferences
  - id: uuid
  - userId: uuid
  - schoolId: uuid?
  - channelType: NotificationChannel[]
  - groupTypes: string[]
  - priority: NotificationPriority
  - enabled: boolean

notification_templates
  - id: uuid
  - schoolId: uuid?
  - type: TemplateType
  - content: jsonb
  - variables: string[]
  - createdBy: uuid
```

### AI Service
```typescript
// Primary responsibilities:
- Assignment generation
- Performance prediction
- Personalized learning paths

// Events Published:
- AI_PREDICTION_GENERATED
- LEARNING_PATH_CREATED

// Events Consumed:
- GRADE_RECORDED (from Academic)
- PERFORMANCE_UPDATED (from Academic)
- KYC_VERIFIED (from KYC)

// Database Schema:
ai_models
  - id: uuid
  - type: ModelType
  - version: string
  - metadata: jsonb

predictions
  - id: uuid
  - studentId: uuid
  - modelId: uuid
  - prediction: jsonb
```

### File Service
```typescript
// Primary responsibilities:
- File upload/download
- File storage management
- File access control

// Events Published:
- FILE_UPLOADED
- FILE_DELETED

// Events Consumed:
- USER_DELETED (from Auth)
- ASSIGNMENT_CREATED (from Academic)

// Database Schema:
files
  - id: uuid
  - ownerId: uuid
  - type: FileType
  - path: string
  - metadata: jsonb
```

## Implementation Priority
1. Auth Service (with KYC integration)
2. User Service (with professional profiles)
3. KYC Service
4. School Service
5. File Service
6. Academic Service
7. Payment Service
8. Notification Service
9. Social Service
10. Chat Service
11. AI Service

## Event Communication
Using RabbitMQ for:
- Reliability
- Message persistence
- Dead letter queues
- Message routing capabilities

## Database Strategy
- PostgreSQL with separate schemas per service
- Shared instance initially
- Prepared for future database separation
- Migrations managed through TypeORM

## Testing Strategy
- Unit tests for business logic
- Integration tests for API endpoints
- Contract tests for service communication
- E2E tests for critical flows
- Document validation testing
- Verification workflow testing
- Status updates testing
- Integration testing with auth flow
- Social features testing
- Post creation and visibility testing
- Comment threading testing
- Reaction management testing
- Connection flows testing

## Security Measures
- Request validation
- Rate limiting
- JWT with short expiry
- Refresh tokens
- Role-based access control
- Input sanitization
- Audit logging
- Document encryption at rest
- Secure document storage
- Access audit logging
- Verification attempt tracking
- Document expiry management
- Content moderation
- Rate limiting for posts/comments
- Media scanning
- User reporting system

## Integration Considerations
- KYC Service requires File Service for document storage
- Social Service requires Notification Service for alerts
- Chat Service requires File Service for media sharing
- All services require Auth Service for verification
``` 