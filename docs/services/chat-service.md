# Chat Service Development Plan

## Service Overview

The Chat Service handles real-time messaging, group chats, announcements, and message history. It provides specialized features for school-parent communication and educational context messaging.

## Dependencies

### Shared Libraries

```typescript
// From @eduflow/common
import { createLogger, ErrorHandler, MessageUtils } from '@eduflow/common';

// From @eduflow/types
import { Chat, Message, ChatType, ParticipantRole } from '@eduflow/types';

// From @eduflow/validators
import { validateMessage, validateParticipant } from '@eduflow/validators';

// From @eduflow/middleware
import { authGuard, roleGuard, chatGuard } from '@eduflow/middleware';

// From @eduflow/constants
import { CHAT_TYPES, MESSAGE_TYPES, PARTICIPANT_ROLES } from '@eduflow/constants';
```

### External Dependencies

```json
{
  "dependencies": {
    "fastify": "^4.21.0",
    "@fastify/swagger": "^8.8.0",
    "@fastify/websocket": "^8.2.0",
    "socket.io": "^4.7.2",
    "zod": "^3.22.2",
    "pg": "^8.11.3",
    "@prisma/client": "^5.2.0",
    "redis": "^4.6.8",
    "@aws-sdk/client-comprehend": "^3.405.0",
    "linkifyjs": "^4.1.1",
    "sanitize-html": "^2.11.0",
    "@fastify/redis": "^6.1.1",
    "ioredis": "^5.3.2",
    "bull": "^4.11.3",
    "firebase-admin": "^11.10.1" // For push notifications
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
model Chat {
  id          String    @id @default(uuid())
  type        ChatType  // DIRECT, GROUP, ANNOUNCEMENT, SCHOOL_BROADCAST
  schoolId    String?   // For school-specific chats
  classId     String?   // For class-specific chats
  title       String?   // Required for groups/announcements
  metadata    Json?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([schoolId, type])
  @@map("chats")
}

model ChatParticipant {
  id        String          @id @default(uuid())
  chatId    String
  userId    String
  role      ParticipantRole // ADMIN, MEMBER, READONLY
  status    ParticipantStatus
  metadata  Json?
  joinedAt  DateTime        @default(now())
  leftAt    DateTime?

  @@unique([chatId, userId])
  @@map("chat_participants")
}

model Message {
  id            String       @id @default(uuid())
  chatId        String
  senderId      String
  type          MessageType  // TEXT, FILE, ANNOUNCEMENT
  content       String
  attachments   String[]     // Array of attachment URLs
  metadata      Json?
  isEdited      Boolean      @default(false)
  isAnnouncement Boolean     @default(false)
  targetGroups  String[]     // For targeted announcements
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  @@index([chatId, createdAt])
  @@map("messages")
}

model MessageStatus {
  id        String        @id @default(uuid())
  messageId String
  userId    String
  status    DeliveryStatus
  readAt    DateTime?
  metadata  Json?
  updatedAt DateTime      @updatedAt

  @@unique([messageId, userId])
  @@map("message_statuses")
}

model AnnouncementGroup {
  id          String   @id @default(uuid())
  schoolId    String
  name        String
  description String?
  members     String[] // Array of user IDs
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([schoolId, name])
  @@map("announcement_groups")
}

model ChatSettings {
  id            String   @id @default(uuid())
  userId        String   @unique
  notifications Json     // Notification preferences
  muted         String[] // Array of chat IDs
  archived      String[] // Array of chat IDs
  metadata      Json?
  updatedAt     DateTime @updatedAt

  @@map("chat_settings")
}
```

## Event System

### Events Published

```typescript
type ChatEvents = {
  MESSAGE_SENT: {
    messageId: string;
    chatId: string;
    senderId: string;
    type: MessageType;
    timestamp: Date;
  };
  MESSAGE_DELIVERED: {
    messageId: string;
    userId: string;
    timestamp: Date;
  };
  MESSAGE_READ: {
    messageId: string;
    userId: string;
    timestamp: Date;
  };
  ANNOUNCEMENT_SENT: {
    messageId: string;
    schoolId: string;
    targetGroups: string[];
    timestamp: Date;
  };
  CHAT_CREATED: {
    chatId: string;
    type: ChatType;
    creatorId: string;
    timestamp: Date;
  };
  PARTICIPANT_ADDED: {
    chatId: string;
    userId: string;
    role: ParticipantRole;
    timestamp: Date;
  };
};
```

### Events Consumed

```typescript
type ConsumedEvents = {
  USER_CREATED: {
    userId: string;
    role: string;
  };
  SCHOOL_CREATED: {
    schoolId: string;
    name: string;
  };
  CLASS_CREATED: {
    classId: string;
    schoolId: string;
  };
  STUDENT_ENROLLED: {
    studentId: string;
    schoolId: string;
    classId: string;
  };
  PARENT_LINKED: {
    parentId: string;
    studentId: string;
    schoolId: string;
  };
};
```

## API Endpoints

### Chat Management

```typescript
// POST /chats
type CreateChatRequest = {
  type: ChatType;
  schoolId?: string;
  classId?: string;
  title?: string;
  participants: Array<{
    userId: string;
    role: ParticipantRole;
  }>;
  metadata?: Record<string, unknown>;
};

// POST /chats/:chatId/messages
type SendMessageRequest = {
  content: string;
  type: MessageType;
  attachments?: string[];
  isAnnouncement?: boolean;
  targetGroups?: string[];
  metadata?: Record<string, unknown>;
};
```

### School Announcements

```typescript
// POST /schools/:schoolId/announcements
type SendAnnouncementRequest = {
  title: string;
  content: string;
  targetGroups: string[]; // Group IDs or special groups like "ALL_PARENTS"
  attachments?: string[];
  metadata?: Record<string, unknown>;
};

// POST /schools/:schoolId/groups
type CreateAnnouncementGroupRequest = {
  name: string;
  description?: string;
  members: string[];
  metadata?: Record<string, unknown>;
};
```

### Message Management

```typescript
// GET /chats/:chatId/messages
type GetMessagesRequest = {
  limit?: number;
  before?: Date;
  after?: Date;
  type?: MessageType;
};

// PUT /messages/:messageId/status
type UpdateMessageStatusRequest = {
  status: DeliveryStatus;
  metadata?: Record<string, unknown>;
};
```

## Implementation Plan

### Phase 1: Core Messaging

1. Real-time messaging
2. Message delivery
3. Read receipts
4. Basic groups

### Phase 2: School Features

1. School announcements
2. Parent groups
3. Class chats
4. Targeted messaging

### Phase 3: Advanced Features

1. Rich media support
2. Message threading
3. Message search
4. Chat archiving

### Phase 4: Optimization

1. Push notifications
2. Message queuing
3. Performance scaling
4. Analytics system

## Testing Strategy

### Unit Tests

```typescript
// Message service tests
describe('MessageService', () => {
  test('should send messages');
  test('should handle delivery');
  test('should track status');
});

// Announcement service tests
describe('AnnouncementService', () => {
  test('should send announcements');
  test('should target groups');
  test('should notify parents');
});
```

### Integration Tests

```typescript
describe('Chat API', () => {
  test('should handle real-time messages');
  test('should manage groups');
  test('should deliver announcements');
  test('should track notifications');
});
```

## Monitoring & Logging

### Metrics

- Message delivery rate
- Real-time performance
- Group activity
- Announcement reach
- System latency

### Logging

```typescript
const logger = createLogger({
  service: 'chat-service',
  level: process.env.LOG_LEVEL || 'info',
  metadata: {
    version: process.env.APP_VERSION,
  },
});
```

## Security Measures

1. Message encryption
2. Access control
3. Rate limiting
4. Content filtering
5. Privacy protection
