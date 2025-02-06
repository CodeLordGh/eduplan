# Notification Service Development Plan

## Service Overview
The Notification Service handles real-time notifications, email notifications, SMS notifications, and notification preferences. It provides a centralized system for all types of notifications across the platform.

## Dependencies

### Shared Libraries
```typescript
// From @eduflow/common
import { createLogger, ErrorHandler, TemplateUtils } from '@eduflow/common'

// From @eduflow/types
import { Notification, NotificationType, NotificationStatus } from '@eduflow/types'

// From @eduflow/validators
import { validateNotification, validateTemplate } from '@eduflow/validators'

// From @eduflow/middleware
import { authGuard, roleGuard, rateLimiter } from '@eduflow/middleware'

// From @eduflow/constants
import { NOTIFICATION_TYPES, CHANNELS } from '@eduflow/constants'
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
    "@fastify/websocket": "^8.2.0",
    "socket.io": "^4.7.2",
    "nodemailer": "^6.9.4",
    "twilio": "^4.16.0",
    "handlebars": "^4.7.8",
    "bull": "^4.11.3",
    "@fastify/redis": "^6.1.1",
    "ioredis": "^5.3.2"
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
model Notification {
  id        String            @id @default(uuid())
  userId    String
  type      NotificationType
  content   Json
  status    NotificationStatus
  readAt    DateTime?
  metadata  Json?
  createdAt DateTime          @default(now())
  updatedAt DateTime          @updatedAt

  @@index([userId, status])
  @@map("notifications")
}

model NotificationPreference {
  id        String   @id @default(uuid())
  userId    String
  type      NotificationType
  channels  String[] // EMAIL, SMS, PUSH, etc.
  enabled   Boolean  @default(true)
  metadata  Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, type])
  @@map("notification_preferences")
}

model NotificationTemplate {
  id          String   @id @default(uuid())
  type        NotificationType
  name        String   @unique
  subject     String?
  content     String
  variables   String[] // Required template variables
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("notification_templates")
}

model DeviceToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  platform  String   // iOS, Android, Web
  metadata  Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("device_tokens")
}
```

## Event System

### Events Published
```typescript
type NotificationEvents = {
  NOTIFICATION_SENT: {
    notificationId: string
    userId: string
    type: NotificationType
    channels: string[]
    timestamp: Date
  }
  NOTIFICATION_FAILED: {
    notificationId: string
    userId: string
    reason: string
    timestamp: Date
  }
  NOTIFICATION_READ: {
    notificationId: string
    userId: string
    timestamp: Date
  }
}
```

### Events Consumed
```typescript
// Consuming ALL events that require notifications
type ConsumedEvents = {
  // Auth Events
  USER_CREATED: { userId: string }
  LOGIN_ATTEMPTED: { userId: string, success: boolean }
  
  // Academic Events
  GRADE_RECORDED: { studentId: string, grade: number }
  ASSIGNMENT_CREATED: { classId: string }
  
  // Payment Events
  PAYMENT_PROCESSED: { userId: string, amount: number }
  INVOICE_GENERATED: { userId: string }
  
  // Social Events
  POST_CREATED: { authorId: string }
  COMMENT_ADDED: { postId: string }
  
  // Chat Events
  MESSAGE_SENT: { chatId: string }
  MESSAGE_DELIVERED: { messageId: string }

  EMPLOYEE_ASSIGNMENT_PENDING: {
    assignmentId: string
    schoolId: string
    employeeId: string
    type: string
  }

  EMPLOYEE_ASSIGNMENT_APPROVED: {
    assignmentId: string
    schoolId: string
    employeeId: string
    approvedBy: string
  }

  EMPLOYEE_TERMINATED: {
    employeeId: string
    schoolId: string
    terminatedBy: string
    reason: string
    type: string
  }

  SCHOOL_HEAD_ASSIGNED: {
    schoolId: string
    userId: string
    assignedBy: string
  }

  SCHOOL_HEAD_REMOVED: {
    schoolId: string
    userId: string
    removedBy: string
    reason: string
  }

  SCHOOL_PERFORMANCE_UPDATED: {
    schoolId: string
    period: string
  }

  // Payment Events
  PAYMENT_RECORDED: {
    paymentId: string
    schoolId: string
    studentId: string
    amount: number
    currency: string
  }

  RECEIPT_GENERATED: {
    paymentId: string
    schoolId: string
    receiptNumber: string
    parentId: string
    studentId: string
  }

  PAYMENT_TEMPLATE_UPDATED: {
    schoolId: string
    templateId: string
    type: string
  }

  // Academic Events
  ACADEMIC_YEAR_CREATED: {
    schoolId: string
    academicYearId: string
    name: string
  }

  TERM_STARTED: {
    schoolId: string
    termId: string
    academicYearId: string
  }

  SUBJECT_ASSIGNED: {
    schoolId: string
    teacherId: string
    subjectId: string
  }

  CLASS_SCHEDULE_UPDATED: {
    schoolId: string
    classId: string
    academicYearId: string
  }

  GRADE_RECORDED: {
    schoolId: string
    studentId: string
    subjectId: string
    teacherId: string
    termId: string
  }

  REPORT_CARD_PENDING: {
    schoolId: string
    studentId: string
    termId: string
    missingGrades: string[]  // Subject IDs with missing grades
  }

  REPORT_CARD_COMPLETE: {
    schoolId: string
    studentId: string
    termId: string
  }
}
```

## API Endpoints

### Notification Management
```typescript
// GET /notifications
type GetNotificationsRequest = {
  status?: NotificationStatus
  type?: NotificationType
  limit?: number
  offset?: number
}

// PUT /notifications/:notificationId/read
type MarkAsReadRequest = {
  notificationId: string
}
```

### Preference Management
```typescript
// PUT /preferences
type UpdatePreferencesRequest = {
  type: NotificationType
  channels: string[]
  enabled: boolean
}

// GET /preferences
type GetPreferencesResponse = {
  preferences: NotificationPreference[]
}
```

### Device Management
```typescript
// POST /devices
type RegisterDeviceRequest = {
  token: string
  platform: string
  metadata?: Record<string, unknown>
}

// DELETE /devices/:token
type UnregisterDeviceRequest = {
  token: string
}
```

## Implementation Plan

### Phase 1: Core Notification System
1. Notification creation
2. Template management
3. Channel integration
4. Real-time delivery

### Phase 2: Preference System
1. User preferences
2. Channel preferences
3. Template customization
4. Frequency controls

### Phase 3: Device Management
1. Device registration
2. Push notifications
3. Token management
4. Platform-specific handling

### Phase 4: Advanced Features
1. Batch processing
2. Rate limiting
3. Analytics system
4. A/B testing

### Phase 5: Employee Notifications
1. New employee alerts
2. Termination notifications
3. Role change alerts
4. Performance report notifications

### Phase 6: Payment Notifications
1. Payment confirmation alerts
2. Receipt delivery system
3. Payment reminder templates
4. Custom school templates
5. Offline payment tracking

### Phase 7: Academic Notifications
1. Academic calendar alerts
2. Class schedule notifications
3. Grade recording reminders
4. Report card status alerts
5. Missing grades notifications

## Testing Strategy

### Unit Tests
```typescript
// Notification service tests
describe('NotificationService', () => {
  test('should create notifications')
  test('should apply templates')
  test('should respect preferences')
})

// Channel service tests
describe('ChannelService', () => {
  test('should send emails')
  test('should send SMS')
  test('should send push notifications')
})

// Employee notification tests
describe('EmployeeNotificationService', () => {
  test('should notify owner of new employees')
  test('should notify of terminations')
  test('should alert role changes')
  test('should send performance updates')
})

// Payment notification tests
describe('PaymentNotificationService', () => {
  test('should send payment confirmations')
  test('should deliver digital receipts')
  test('should notify accountants')
  test('should handle custom school templates')
})

// Academic notification tests
describe('AcademicNotificationService', () => {
  test('should notify term start/end')
  test('should alert schedule changes')
  test('should remind about missing grades')
  test('should notify report card status')
})
```

### Integration Tests
```typescript
describe('Notification API', () => {
  test('should handle real-time delivery')
  test('should manage preferences')
  test('should track delivery status')
})
```

## Monitoring & Logging

### Metrics
- Delivery success rate
- Channel performance
- Template usage
- User engagement
- System latency

### Logging
```typescript
const logger = createLogger({
  service: 'notification-service',
  level: process.env.LOG_LEVEL || 'info',
  metadata: {
    version: process.env.APP_VERSION
  }
})
```

## Performance Considerations
1. Queue-based processing
2. Channel-specific batching
3. Template caching
4. Preference caching
5. Real-time optimizations 

## Security Measures
6. Employee data privacy
7. Termination notification access control
8. Performance data distribution rules 