# Academic Service Development Plan

## Service Overview
The Academic Service manages grades, assignments, performance tracking, and AI-assisted assessment. It handles the core educational data and academic operations within the system.

## Dependencies

### Shared Libraries
```typescript
// From @eduflow/common
import { createLogger, ErrorHandler, ValidationUtils } from '@eduflow/common'

// From @eduflow/types
import { Grade, Assignment, Performance, AssessmentType } from '@eduflow/types'

// From @eduflow/validators
import { validateGrade, validateAssignment } from '@eduflow/validators'

// From @eduflow/middleware
import { authGuard, roleGuard, academicGuard } from '@eduflow/middleware'

// From @eduflow/constants
import { GRADE_TYPES, ASSESSMENT_TYPES } from '@eduflow/constants'
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
    "@fastify/redis": "^6.1.1",
    "ioredis": "^5.3.2",
    "openai": "^4.0.0",
    "@fastify/multipart": "^7.7.3"
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
model Grade {
  id        String     @id @default(uuid())
  studentId String
  subjectId String
  score     Float
  type      GradeType
  metadata  Json?      // Additional grade data
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  @@index([studentId, subjectId])
  @@map("grades")
}

model Assignment {
  id          String    @id @default(uuid())
  classId     String
  teacherId   String
  title       String
  description String
  dueDate     DateTime
  type        AssignmentType
  metadata    Json?     // Rubric, attachments, etc.
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("assignments")
}

model AssignmentSubmission {
  id           String    @id @default(uuid())
  assignmentId String
  studentId    String
  content      Json      // Submission content
  status       SubmissionStatus
  grade        Float?
  feedback     String?
  submittedAt  DateTime  @default(now())
  gradedAt     DateTime?

  @@unique([assignmentId, studentId])
  @@map("assignment_submissions")
}

model Performance {
  id         String   @id @default(uuid())
  studentId  String
  subjectId  String
  metrics    Json     // Performance metrics
  period     String   // Academic period
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([studentId, subjectId, period])
  @@map("performances")
}

model AiAssessment {
  id           String   @id @default(uuid())
  submissionId String
  analysis     Json     // AI analysis results
  suggestions  Json     // Improvement suggestions
  confidence   Float    // AI confidence score
  createdAt    DateTime @default(now())

  @@map("ai_assessments")
}
```

## Event System

### Events Published
```typescript
type AcademicEvents = {
  GRADE_RECORDED: {
    gradeId: string
    studentId: string
    subjectId: string
    score: number
    type: GradeType
    timestamp: Date
  }
  ASSIGNMENT_CREATED: {
    assignmentId: string
    classId: string
    teacherId: string
    dueDate: Date
    timestamp: Date
  }
  PERFORMANCE_UPDATED: {
    studentId: string
    subjectId: string
    period: string
    metrics: Record<string, number>
    timestamp: Date
  }
  SUBMISSION_GRADED: {
    submissionId: string
    assignmentId: string
    studentId: string
    grade: number
    timestamp: Date
  }
}
```

### Events Consumed
```typescript
type ConsumedEvents = {
  CLASS_CREATED: {
    classId: string
    schoolId: string
    grade: string
  }
  STAFF_ASSIGNED: {
    userId: string
    schoolId: string
    role: string
  }
  KYC_VERIFIED: {
    userId: string
    documentType: string
  }
  AI_PREDICTION_GENERATED: {
    studentId: string
    prediction: object
  }
}
```

## API Endpoints

### Grade Management
```typescript
// POST /grades
type CreateGradeRequest = {
  studentId: string
  subjectId: string
  score: number
  type: GradeType
  metadata?: Record<string, unknown>
}

// GET /students/:studentId/grades
type GetGradesResponse = {
  grades: Grade[]
  summary: {
    average: number
    bySubject: Record<string, number>
  }
}
```

### Assignment Management
```typescript
// POST /assignments
type CreateAssignmentRequest = {
  classId: string
  title: string
  description: string
  dueDate: Date
  type: AssignmentType
  metadata?: Record<string, unknown>
}

// POST /assignments/:assignmentId/submissions
type SubmitAssignmentRequest = {
  studentId: string
  content: Record<string, unknown>
}
```

### Performance Tracking
```typescript
// GET /students/:studentId/performance
type GetPerformanceResponse = {
  current: Performance
  history: Performance[]
  predictions: {
    nextPeriod: Record<string, number>
    confidence: number
  }
}
```

## Implementation Plan

### Phase 1: Grade Management
1. Grade recording system
2. Grade calculation rules
3. Grade history tracking
4. Grade analytics

### Phase 2: Assignment System
1. Assignment creation
2. Submission handling
3. Grading workflow
4. File attachments

### Phase 3: Performance Tracking
1. Performance metrics
2. Progress tracking
3. Historical analysis
4. Performance reports

### Phase 4: AI Integration
1. AI-assisted grading
2. Performance prediction
3. Learning path suggestions
4. Automated feedback

## Testing Strategy

### Unit Tests
```typescript
// Grade service tests
describe('GradeService', () => {
  test('should calculate grade averages')
  test('should validate grade ranges')
  test('should track grade history')
})

// Assignment service tests
describe('AssignmentService', () => {
  test('should handle submissions')
  test('should enforce due dates')
  test('should manage attachments')
})
```

### Integration Tests
```typescript
describe('Academic API', () => {
  test('should record grades')
  test('should manage assignments')
  test('should track performance')
  test('should integrate with AI')
})
```

## Monitoring & Logging

### Metrics
- Grade distribution
- Assignment completion rate
- Performance trends
- AI assessment accuracy
- API response times

### Logging
```typescript
const logger = createLogger({
  service: 'academic-service',
  level: process.env.LOG_LEVEL || 'info',
  metadata: {
    version: process.env.APP_VERSION
  }
})
```

## Data Validation Rules
1. Grade range validation
2. Assignment deadline rules
3. Submission format validation
4. Performance metric bounds
5. AI confidence thresholds 