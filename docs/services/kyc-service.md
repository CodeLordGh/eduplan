# KYC Service Development Plan

## Service Overview
The KYC Service handles document verification, identity validation, school verification, and employment eligibility checking. It ensures compliance and security across the platform.

## Dependencies

### Shared Libraries
```typescript
// From @eduflow/common
import { createLogger, ErrorHandler, ValidationUtils } from '@eduflow/common'

// From @eduflow/types
import { Document, VerificationStatus, DocumentType } from '@eduflow/types'

// From @eduflow/validators
import { validateDocument, validateIdentity } from '@eduflow/validators'

// From @eduflow/middleware
import { authGuard, roleGuard, kycGuard } from '@eduflow/middleware'

// From @eduflow/constants
import { DOCUMENT_TYPES, VERIFICATION_STATUS } from '@eduflow/constants'
```

### External Dependencies
```json
{
  "dependencies": {
    "fastify": "^4.21.0",
    "@fastify/swagger": "^8.8.0",
    "zod": "^3.22.2",
    "pg": "^8.11.3",
    "@prisma/client": "^5.2.0",
    "@aws-sdk/client-textract": "^3.405.0",
    "@google-cloud/vision": "^4.0.2",
    "tesseract.js": "^4.1.1",
    "face-api.js": "^0.22.2",
    "axios": "^1.5.0",
    "node-geocoder": "^4.2.0",
    "@fastify/redis": "^6.1.1",
    "ioredis": "^5.3.2",
    "bull": "^4.11.3"
  },
  "devDependencies": {
    "prisma": "^5.2.0",
    "jest": "^29.6.4",
    "typescript": "^5.2.2"
  }
}
```

## Database Schema (Prisma)
```prisma
model KYCDocument {
  id            String            @id @default(uuid())
  userId        String
  type          DocumentType
  status        VerificationStatus
  documentUrls  String[]         // Array of document URLs
  metadata      Json?            // Additional document data
  verifiedAt    DateTime?
  verifiedBy    String?          // Admin/System ID
  expiresAt     DateTime?
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  @@index([userId, type])
  @@map("kyc_documents")
}

model VerificationHistory {
  id          String            @id @default(uuid())
  entityId    String            // User or School ID
  entityType  EntityType        // USER or SCHOOL
  status      VerificationStatus
  verifiedBy  String?
  notes       String?
  metadata    Json?
  createdAt   DateTime          @default(now())

  @@index([entityId, entityType])
  @@map("verification_history")
}

model EmploymentEligibility {
  id            String            @id @default(uuid())
  userId        String            @unique
  status        EligibilityStatus
  verificationId String?
  documents     String[]         // Array of supporting documents
  metadata      Json?
  expiresAt     DateTime?
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  @@map("employment_eligibility")
}

model SchoolVerification {
  id            String            @id @default(uuid())
  schoolId      String            @unique
  status        VerificationStatus
  documents     String[]         // Array of verification documents
  licenseNumber String?
  metadata      Json?
  verifiedAt    DateTime?
  expiresAt     DateTime?
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  @@map("school_verifications")
}

model VerificationRule {
  id            String   @id @default(uuid())
  type          String   // Document type or verification type
  rules         Json     // Validation rules
  metadata      Json?
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("verification_rules")
}

enum DocumentType {
  SCHOOL_OWNERSHIP_PROOF
  OWNER_IDENTITY
}

model OwnershipVerification {
  id          String    @id @default(uuid())
  userId      String
  schoolId    String
  status      VerificationStatus
  documents   Json[]    // Array of document references
  verifiedBy  String?
  verifiedAt  DateTime?
  metadata    Json?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("ownership_verifications")
}
```

## Event System

### Events Published
```typescript
type KYCEvents = {
  KYC_SUBMITTED: {
    userId: string
    documentType: string
    timestamp: Date
  }
  KYC_VERIFIED: {
    userId: string
    documentType: string
    verificationId: string
    timestamp: Date
  }
  KYC_REJECTED: {
    userId: string
    reason: string
    timestamp: Date
  }
  SCHOOL_VERIFIED: {
    schoolId: string
    verificationId: string
    timestamp: Date
  }
  EMPLOYMENT_ELIGIBILITY_UPDATED: {
    userId: string
    status: string
    reason?: string
    timestamp: Date
  }
  OWNER_VERIFICATION_COMPLETED: {
    userId: string
    schoolId: string
    status: VerificationStatus
    timestamp: Date
  }
  OWNER_DOCUMENTS_REQUESTED: {
    userId: string
    schoolId: string
    documentTypes: DocumentType[]
    timestamp: Date
  }
}
```

### Events Consumed
```typescript
type ConsumedEvents = {
  USER_CREATED: {
    userId: string
    role: string
  }
  SCHOOL_CREATED: {
    schoolId: string
    type: string
  }
  STAFF_ASSIGNED: {
    userId: string
    schoolId: string
    role: string
  }
  FILE_UPLOADED: {
    fileId: string
    type: string
    ownerId: string
  }
  SCHOOL_OWNER_CREATION_REQUESTED: {
    requestId: string
    schoolId: string
    ownerData: object
  }
  SCHOOL_OWNER_LINKED: {
    schoolId: string
    ownerId: string
    ownershipType: string
  }
}
```

## API Endpoints

### Document Verification
```typescript
// POST /documents/verify
type SubmitDocumentRequest = {
  userId: string
  type: DocumentType
  documents: File[]
  metadata?: Record<string, unknown>
}

// GET /users/:userId/verification-status
type GetVerificationStatusResponse = {
  status: VerificationStatus
  documents: Array<{
    type: DocumentType
    status: VerificationStatus
    verifiedAt?: Date
  }>
}
```

### School Verification
```typescript
// POST /schools/verify
type VerifySchoolRequest = {
  schoolId: string
  documents: File[]
  licenseNumber?: string
  metadata?: Record<string, unknown>
}

// GET /schools/:schoolId/verification
type GetSchoolVerificationResponse = {
  status: VerificationStatus
  licenseNumber?: string
  verifiedAt?: Date
  expiresAt?: Date
}
```

### Employment Eligibility
```typescript
// POST /employment/verify
type VerifyEmploymentRequest = {
  userId: string
  documents: File[]
  metadata?: Record<string, unknown>
}

// GET /employment/:userId/status
type GetEmploymentStatusResponse = {
  status: EligibilityStatus
  documents: string[]
  expiresAt?: Date
}
```

### School Owner Verification
```typescript
// POST /kyc/owner-verification
type InitiateOwnerVerificationRequest = {
  userId: string
  schoolId: string
  documents: {
    type: DocumentType
    fileId: string
  }[]
}

// GET /kyc/owner-verification/:userId/:schoolId
type GetOwnerVerificationResponse = {
  status: VerificationStatus
  documents: {
    type: DocumentType
    status: VerificationStatus
    url: string
  }[]
  verifiedAt?: Date
}

// PUT /kyc/owner-verification/:verificationId
type UpdateOwnerVerificationRequest = {
  status: VerificationStatus
  notes?: string
}
```

## Implementation Plan

### Phase 1: Core Verification
1. Document upload handling
2. OCR integration
3. Identity verification
4. Basic rule engine

### Phase 2: School Verification
1. License verification
2. Document validation
3. Compliance checking
4. Expiry management

### Phase 3: Employment Features
1. Background checks
2. Credential verification
3. Employment history
4. Eligibility tracking

### Phase 4: Advanced Features
1. AI-powered verification
2. Fraud detection
3. Automated renewals
4. Compliance reporting

### Phase 5: School Owner Verification
1. Owner document validation
2. School ownership verification
3. Multi-school verification handling
4. Automated document checks

## Testing Strategy

### Unit Tests
```typescript
// Document verification tests
describe('DocumentService', () => {
  test('should validate documents')
  test('should process OCR')
  test('should verify identity')
})

// School verification tests
describe('SchoolVerificationService', () => {
  test('should verify licenses')
  test('should validate documents')
  test('should track expiry')
})

// Owner verification tests
describe('OwnerVerificationService', () => {
  test('should validate owner documents')
  test('should verify school ownership')
  test('should handle multiple schools')
  test('should track verification history')
})
```

### Integration Tests
```typescript
describe('KYC API', () => {
  test('should handle document submission')
  test('should process verifications')
  test('should manage eligibility')
  test('should integrate with external services')
})

describe('Owner Verification API', () => {
  test('should process owner documents')
  test('should verify ownership status')
  test('should integrate with school service')
})
```

## Monitoring & Logging

### Metrics
- Verification success rate
- Processing time
- Error distribution
- Document quality scores
- System performance
- Owner verification success rate
- Document processing time
- Verification turnaround time

### Logging
```typescript
const logger = createLogger({
  service: 'kyc-service',
  level: process.env.LOG_LEVEL || 'info',
  metadata: {
    version: process.env.APP_VERSION
  }
})
```

## Security Measures
1. Document encryption
2. PII protection
3. Access control
4. Audit logging
5. Data retention policies 