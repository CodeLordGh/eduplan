# Social Service Development Plan

## Service Overview
The Social Service manages social networking features including the Hub (general platform) and B-Hub (business networking). It handles posts, comments, reactions, content moderation, and professional networking.

## Dependencies

### Shared Libraries
```typescript
// From @eduflow/common
import { createLogger, ErrorHandler, ContentUtils } from '@eduflow/common'

// From @eduflow/types
import { Post, Comment, Reaction, Connection } from '@eduflow/types'

// From @eduflow/validators
import { validateContent, validateConnection } from '@eduflow/validators'

// From @eduflow/middleware
import { authGuard, roleGuard, contentGuard } from '@eduflow/middleware'

// From @eduflow/constants
import { POST_TYPES, REACTION_TYPES, VISIBILITY } from '@eduflow/constants'
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
    "redis": "^4.6.8",
    "@aws-sdk/client-comprehend": "^3.405.0",
    "linkifyjs": "^4.1.1",
    "sanitize-html": "^2.11.0",
    "@fastify/redis": "^6.1.1",
    "ioredis": "^5.3.2",
    "bull": "^4.11.3",
    "elasticsearch": "^16.7.3"
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
model Post {
  id          String     @id @default(uuid())
  userId      String
  content     String
  type        PostType   // HUB or BHUB
  visibility  Visibility
  attachments String[]   // Array of attachment URLs
  metadata    Json?
  isEdited    Boolean    @default(false)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([userId, type])
  @@map("posts")
}

model Comment {
  id        String   @id @default(uuid())
  postId    String
  userId    String
  content   String
  parentId  String?  // For nested comments
  metadata  Json?
  isEdited  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([postId])
  @@map("comments")
}

model Reaction {
  id         String       @id @default(uuid())
  entityId   String      // Post or Comment ID
  entityType EntityType  // POST or COMMENT
  userId     String
  type       ReactionType
  createdAt  DateTime    @default(now())

  @@unique([entityId, entityType, userId])
  @@map("reactions")
}

model Connection {
  id           String           @id @default(uuid())
  requesterId  String
  receiverId   String
  status       ConnectionStatus
  metadata     Json?
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt

  @@unique([requesterId, receiverId])
  @@map("connections")
}

model ContentModeration {
  id        String           @id @default(uuid())
  entityId  String          // Post or Comment ID
  type      ModerationType
  status    ModerationStatus
  reason    String?
  metadata  Json?
  createdAt DateTime        @default(now())

  @@index([entityId, status])
  @@map("content_moderation")
}

model ProfessionalProfile {
  id            String   @id @default(uuid())
  userId        String   @unique
  headline      String?
  bio           String?
  skills        String[]
  experience    Json[]
  education     Json[]
  certifications Json[]
  metadata      Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("professional_profiles")
}
```

## Event System

### Events Published
```typescript
type SocialEvents = {
  POST_CREATED: {
    postId: string
    userId: string
    type: PostType
    timestamp: Date
  }
  COMMENT_ADDED: {
    commentId: string
    postId: string
    userId: string
    timestamp: Date
  }
  REACTION_ADDED: {
    entityId: string
    entityType: string
    userId: string
    type: ReactionType
    timestamp: Date
  }
  CONNECTION_REQUESTED: {
    connectionId: string
    requesterId: string
    receiverId: string
    timestamp: Date
  }
  CONNECTION_UPDATED: {
    connectionId: string
    status: ConnectionStatus
    timestamp: Date
  }
  CONTENT_MODERATED: {
    entityId: string
    type: ModerationType
    status: ModerationStatus
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
  KYC_VERIFIED: {
    userId: string
    documentType: string
  }
  SCHOOL_VERIFIED: {
    schoolId: string
  }
  GRADE_RECORDED: {
    studentId: string
    grade: number
  }
  FILE_UPLOADED: {
    fileId: string
    type: string
  }
}
```

## API Endpoints

### Post Management
```typescript
// POST /posts
type CreatePostRequest = {
  content: string
  type: PostType
  visibility: Visibility
  attachments?: string[]
  metadata?: Record<string, unknown>
}

// GET /posts
type GetPostsRequest = {
  type?: PostType
  visibility?: Visibility
  userId?: string
  limit?: number
  offset?: number
}
```

### Interaction Management
```typescript
// POST /posts/:postId/comments
type AddCommentRequest = {
  content: string
  parentId?: string
  metadata?: Record<string, unknown>
}

// POST /posts/:postId/reactions
type AddReactionRequest = {
  type: ReactionType
}
```

### Connection Management
```typescript
// POST /connections/request
type RequestConnectionRequest = {
  receiverId: string
  metadata?: Record<string, unknown>
}

// PUT /connections/:connectionId
type UpdateConnectionRequest = {
  status: ConnectionStatus
  metadata?: Record<string, unknown>
}
```

## Implementation Plan

### Phase 1: Core Social Features
1. Post management
2. Comment system
3. Reaction system
4. Content validation

### Phase 2: Professional Networking
1. Connection system
2. Professional profiles
3. B-Hub features
4. Network analytics

### Phase 3: Content Moderation
1. Automated moderation
2. Report handling
3. Content filtering
4. User reputation

### Phase 4: Advanced Features
1. Content recommendation
2. Trending analysis
3. Search optimization
4. Analytics dashboard

## Testing Strategy

### Unit Tests
```typescript
// Post service tests
describe('PostService', () => {
  test('should create posts')
  test('should handle visibility')
  test('should manage interactions')
})

// Connection service tests
describe('ConnectionService', () => {
  test('should handle requests')
  test('should update status')
  test('should maintain privacy')
})
```

### Integration Tests
```typescript
describe('Social API', () => {
  test('should manage posts')
  test('should handle interactions')
  test('should process connections')
  test('should moderate content')
})
```

## Monitoring & Logging

### Metrics
- Post engagement rate
- Connection success rate
- Moderation accuracy
- Response times
- User activity

### Logging
```typescript
const logger = createLogger({
  service: 'social-service',
  level: process.env.LOG_LEVEL || 'info',
  metadata: {
    version: process.env.APP_VERSION
  }
})
```

## Security Measures
1. Content validation
2. Rate limiting
3. Privacy controls
4. Spam prevention
5. User verification 